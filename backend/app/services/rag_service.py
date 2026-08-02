"""
The ONLY module that handles embeddings + vector retrieval (RAG).

Isolated like llm_service so the whole retrieval stack (embedding model, chunking,
vector search) can be swapped without touching routers. Responsibilities:

  * extract_text()      — pull plain text out of an uploaded PDF or Markdown file.
  * embed_texts()       — turn text into Gemini embedding vectors.
  * ingest_document()   — chunk → embed → store (documents + document_chunks rows).
  * retrieve_context()  — find the chunks most similar to a query (pgvector cosine search).

WHY one Postgres+pgvector instead of a separate vector DB: it keeps the infra simple (one
database to run, back up, and deploy) and lets us JOIN embeddings with normal relational
data. For this project's scale that's plenty; a dedicated vector DB would be over-engineering.
"""

from __future__ import annotations

import io
import logging

from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document, DocumentChunk

logger = logging.getLogger(__name__)

# Chunking config: ~1000 chars with overlap so a concept split across a boundary still
# appears (mostly) whole in at least one chunk. Recursive splitter prefers paragraph and
# sentence boundaries before hard-cutting, which keeps chunks readable.
_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)

# Lazy singletons for the two embedding backends (created on first use).
_local_embedder = None  # fastembed model
_gemini_client = None


class RagError(Exception):
    """Raised when embedding/ingestion fails. Routers translate this into a clean error."""


def extract_text(filename: str, data: bytes) -> str:
    """Extract plain text from an uploaded file (PDF or Markdown/plain text).

    Raises:
        RagError: if the file type is unsupported or the PDF can't be parsed.
    """
    lower = filename.lower()
    if lower.endswith(".pdf"):
        try:
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(data))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:  # noqa: BLE001 - surface any PDF parsing failure uniformly
            raise RagError(f"Could not read PDF: {exc}") from exc
    if lower.endswith((".md", ".markdown", ".txt")):
        return data.decode("utf-8", errors="ignore")
    raise RagError("Unsupported file type. Upload a PDF or Markdown (.md) file.")


def _get_local_embedder():
    """Load the fastembed model once. Downloads ~130MB on first use, then caches locally."""
    global _local_embedder
    if _local_embedder is None:
        from fastembed import TextEmbedding

        # bge-small-en-v1.5 → 384-dim vectors; must match EMBEDDING_DIM in models/document.py.
        _local_embedder = TextEmbedding("BAAI/bge-small-en-v1.5")
    return _local_embedder


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts into vectors using the configured EMBED_PROVIDER.

    Returns one vector per input text. Dimension depends on the provider:
      * "local"  → 384 (fastembed bge-small-en) — offline, no key, no cost.
      * "gemini" → 768 (text-embedding-004).
    The active provider's dimension MUST equal the Vector(...) column dimension.

    Raises:
        RagError: if the embedding backend fails.
    """
    try:
        if settings.EMBED_PROVIDER.lower() == "gemini":
            global _gemini_client
            if _gemini_client is None:
                from google import genai

                _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = _gemini_client.models.embed_content(
                model=settings.GEMINI_EMBED_MODEL, contents=texts
            )
            return [list(embedding.values) for embedding in response.embeddings]

        # Default: local fastembed. `embed` returns numpy arrays → convert to plain lists.
        vectors = _get_local_embedder().embed(texts)
        return [vector.tolist() for vector in vectors]
    except Exception as exc:  # noqa: BLE001 - surface any embedding failure uniformly
        logger.warning("Embedding failed: %s", exc)
        raise RagError(f"Embedding failed: {exc}") from exc


def ingest_document(db: Session, project_id: int, filename: str, raw_text: str) -> Document:
    """Chunk `raw_text`, embed each chunk, and store the document + its chunks.

    Returns the created Document (with its chunks populated). Commits the transaction.

    Raises:
        RagError: if the text is empty or embedding fails.
    """
    chunks = [c for c in _splitter.split_text(raw_text) if c.strip()]
    if not chunks:
        raise RagError("The document appears to be empty.")

    vectors = embed_texts(chunks)

    document = Document(project_id=project_id, filename=filename)
    db.add(document)
    db.flush()  # assign document.id before creating chunks

    for text, vector in zip(chunks, vectors):
        db.add(
            DocumentChunk(
                document_id=document.id,
                project_id=project_id,
                chunk_text=text,
                embedding=vector,
            )
        )

    db.commit()
    db.refresh(document)
    return document


def retrieve_context(db: Session, project_id: int, query: str, k: int = 5) -> dict:
    """Return the top-k most relevant chunks for `query` within a project.

    Uses pgvector cosine distance (`<=>`) for nearest-neighbor search — this runs only on
    Postgres in production. Returns a dict:
        { "context": "<joined chunk text>", "documents": ["file1.pdf", ...] }
    with the distinct source filenames that contributed, so the UI can show what grounded
    the generation. Returns empty results (never raises) if there are no documents, so a
    RAG hiccup can't block PRD/story generation.
    """
    if not query.strip():
        return {"context": "", "documents": []}

    try:
        query_vector = embed_texts([query])[0]
        rows = db.execute(
            select(DocumentChunk.chunk_text, Document.filename)
            .join(Document, Document.id == DocumentChunk.document_id)
            .where(DocumentChunk.project_id == project_id)
            # cosine_distance builds the pgvector `<=>` operator; smaller = more similar.
            .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
            .limit(k)
        ).all()
    except Exception as exc:  # noqa: BLE001 - retrieval must degrade gracefully
        logger.warning("Context retrieval failed: %s", exc)
        return {"context": "", "documents": []}

    context = "\n---\n".join(text for text, _ in rows)
    documents = list(dict.fromkeys(filename for _, filename in rows))  # unique, ordered
    return {"context": context, "documents": documents}
