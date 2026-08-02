"""The `projects` table: a product idea owned by a user. Each project can have one PRD."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # ondelete="CASCADE" tells Postgres itself to delete projects when their owner is
    # deleted (defense-in-depth alongside the ORM cascade on the User side).
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    target_audience: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    owner: Mapped["User"] = relationship(back_populates="projects")

    # uselist=False: one project has at most ONE prd in Phase 1 (a 1-to-1 link).
    prd: Mapped["PRD"] = relationship(
        back_populates="project", cascade="all, delete-orphan", uselist=False
    )

    # One project also has at most ONE story set (Phase 2), generated from its PRD.
    story_set: Mapped["StorySet"] = relationship(
        back_populates="project", cascade="all, delete-orphan", uselist=False
    )

    # A project can have many uploaded reference documents (Phase 4 / RAG).
    documents: Mapped[list["Document"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )

    # A project can have many generated PM artifacts (strategy, GTM, OKRs, …), at most one
    # of each type. This is what makes PM Copilot span the full PM lifecycle.
    artifacts: Mapped[list["Artifact"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
