"""Pydantic schemas for uploaded RAG documents."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    """A reference document listed in the UI (the raw chunks/vectors stay server-side)."""

    id: int
    project_id: int
    filename: str
    chunk_count: int  # how many chunks it was split into (a simple "size" signal)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
