"""
The `story_sets` table: the epics + user stories generated from a project's PRD.

WHY store as one JSONB document (mirroring the PRD): a story set is a nested, evolving
structure (epics → stories → acceptance criteria + RICE inputs) that the UI reads and
writes as a whole. One JSONB column keeps the schema simple and lets the shape grow
without new migrations. RICE *scores* and sprint assignments are NOT stored — they're
derived deterministically from the RICE inputs by our own code (see roadmap_service).
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.prd import JSONType  # reuse the JSON/JSONB dual-dialect column type


class StorySet(Base):
    __tablename__ = "story_sets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # unique=True enforces one story set per project at the database level.
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    # The whole structured story set: { "epics": [ { name, stories: [...] } ] }.
    content: Mapped[dict] = mapped_column(JSONType, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project: Mapped["Project"] = relationship(back_populates="story_set")
