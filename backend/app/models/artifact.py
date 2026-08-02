"""
The `artifacts` table: generic, AI-generated PM documents for a project (strategy, market
analysis, OKRs, personas, GTM plan, release notes, stakeholder update, discovery plan, …).

One row per (project, type). Like the PRD, the body is stored as a single JSONB document —
here it's the uniform `ArtifactContent` shape (summary + titled sections) — so every artifact
type shares one table and one renderer, and adding a new type needs no migration.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.prd import JSONType  # reuse the JSONB/JSON dual-dialect column type

class Artifact(Base):
    __tablename__ = "artifacts"
    # A project has at most one artifact of each type; regenerating overwrites it.
    __table_args__ = (UniqueConstraint("project_id", "type", name="uq_artifact_project_type"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # The artifact type key (matches a key in the prompts registry, e.g. "strategy").
    type: Mapped[str] = mapped_column(String, nullable=False)
    # Human-readable label snapshot (e.g. "Product Strategy"); editable by the user.
    title: Mapped[str] = mapped_column(String, nullable=False)

    # The uniform ArtifactContent (summary + sections) stored as JSONB.
    content: Mapped[dict] = mapped_column(JSONType, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project: Mapped["Project"] = relationship(back_populates="artifacts")
