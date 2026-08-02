"""
The `prds` table: the generated Product Requirements Document for a project.

WHY store as JSONB: a PRD is a nested, evolving structure (personas lists, metrics
lists, scope lists). Storing it as one JSONB column keeps the schema simple and lets the
shape grow across phases without new migrations. JSONB (not plain JSON) is indexable and
queryable in Postgres if we ever need it.
"""

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Use real JSONB on Postgres (indexable, efficient) but fall back to generic JSON on
# other databases (e.g. SQLite used in tests). One column definition, two dialects —
# so the app runs on Postgres in prod while tests need no Postgres server.
JSONType = JSON().with_variant(JSONB(), "postgresql")


class PRD(Base):
    __tablename__ = "prds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # unique=True enforces the 1-project-1-PRD rule at the database level.
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    # The whole structured PRD (problem statement, personas, metrics, scope, risks).
    content: Mapped[dict] = mapped_column(JSONType, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    # onupdate keeps updated_at fresh whenever the user edits and saves a section.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project: Mapped["Project"] = relationship(back_populates="prd")
