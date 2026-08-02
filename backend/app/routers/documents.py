"""
Document routes (Phase 4 / RAG): upload / list / delete reference documents for a project.

Uploaded PDFs and Markdown files are chunked, embedded, and stored so that PRD and story
generation can retrieve relevant context from them. Ownership is enforced via
`get_owned_project`, like every other nested resource.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user
from app.models.document import Document, DocumentChunk
from app.models.user import User
from app.routers.projects import get_owned_project
from app.schemas.document import DocumentOut
from app.services.rag_service import RagError, extract_text, ingest_document

router = APIRouter(prefix="/projects/{project_id}/documents", tags=["documents"])


def _chunk_count(db: Session, document_id: int) -> int:
    """Count a document's chunks with a COUNT query.

    We deliberately avoid `len(document.chunks)`, which would load every chunk row —
    including its large embedding vector — just to count them.
    """
    return db.query(func.count(DocumentChunk.id)).filter(
        DocumentChunk.document_id == document_id
    ).scalar()


def _to_out(document: Document, chunk_count: int) -> DocumentOut:
    """Serialize a Document for the UI (chunk_count is computed by the caller)."""
    return DocumentOut(
        id=document.id,
        project_id=document.project_id,
        filename=document.filename,
        chunk_count=chunk_count,
        created_at=document.created_at,
    )


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentOut:
    """Upload a PDF or Markdown file, chunk + embed it, and store it for retrieval."""
    project = get_owned_project(project_id, user, db)

    data = file.file.read()
    try:
        text = extract_text(file.filename, data)
        document = ingest_document(db, project.id, file.filename, text)
    except RagError as exc:
        # 400 for bad input (unsupported/empty file), 502 for an upstream embedding failure.
        code = (
            status.HTTP_502_BAD_GATEWAY
            if "service" in str(exc).lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=code, detail=str(exc)) from exc

    return _to_out(document, _chunk_count(db, document.id))


@router.get("", response_model=list[DocumentOut])
def list_documents(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DocumentOut]:
    """List the reference documents uploaded for a project."""
    project = get_owned_project(project_id, user, db)

    # One grouped COUNT query for all chunk counts, so listing N documents is 2 queries
    # total (not N+1) and never loads embedding vectors.
    counts = dict(
        db.query(DocumentChunk.document_id, func.count(DocumentChunk.id))
        .filter(DocumentChunk.project_id == project.id)
        .group_by(DocumentChunk.document_id)
        .all()
    )
    return [_to_out(doc, counts.get(doc.id, 0)) for doc in project.documents]


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    project_id: int,
    document_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a document (and its chunks, via cascade)."""
    project = get_owned_project(project_id, user, db)
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.project_id == project.id)
        .first()
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    db.delete(document)
    db.commit()
