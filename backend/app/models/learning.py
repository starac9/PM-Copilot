"""
Learning-platform state that follows the user across devices.

  * learn_progress — one row per (user, lesson) the user has marked complete.
  * mentor_chats   — the user's current PM AI Chat conversation (one per user), stored as a
                     JSON list of {role, content} messages like the PRD is stored as JSONB.

Lesson content itself is NOT stored here — it's static data in the frontend; we only keep
the lesson's slug.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.prd import JSONType  # reuse the JSON/JSONB dual-dialect column type


def _now() -> datetime:
    return datetime.now(timezone.utc)


class LearnProgress(Base):
    __tablename__ = "learn_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_slug", name="uq_learn_progress_user_lesson"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    lesson_slug: Mapped[str] = mapped_column(String(100), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped["User"] = relationship(back_populates="learn_progress")


class MentorChat(Base):
    __tablename__ = "mentor_chats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # unique: one saved conversation per user ("New chat" replaces it).
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    messages: Mapped[list] = mapped_column(JSONType, nullable=False, default=list)
    topic: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    user: Mapped["User"] = relationship(back_populates="mentor_chat")
