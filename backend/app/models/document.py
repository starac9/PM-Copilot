"""
RAG storage (Phase 4): uploaded reference documents and their embedded chunks.

Two tables:
  * documents        — one row per uploaded file (PDF / Markdown) for a project.
  * document_chunks  — the file split into pieces, each with its embedding vector.

WHY the embedding column uses a dialect variant: pgvector's `Vector` type is a real
Postgres column type used for similarity search in production. SQLite (used by the tests)
doesn't understand it, so we fall back to JSON there — the same trick as JSONType. Vector
SIMILARITY queries only ever run against Postgres (see rag_service.retrieve_context).
"""

from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Vector dimension of the active embedding provider (see config.EMBED_PROVIDER):
#   local  fastembed bge-small-en → 384   (default; free, offline)
#   gemini text-embedding-004     → 768   (would require changing this + a new migration)
EMBEDDING_DIM = 384

# Vector(768) on Postgres; plain JSON on SQLite so tests can create the table.
EmbeddingType = Vector(EMBEDDING_DIM).with_variant(JSON(), "sqlite")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    project: Mapped["Project"] = relationship(back_populates="documents")
    # Deleting a document removes its chunks (both ORM cascade and DB ondelete).
    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Denormalized project_id so retrieval can filter by project without a join.
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False
    )
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding = mapped_column(EmbeddingType, nullable=False)

    document: Mapped["Document"] = relationship(back_populates="chunks")
