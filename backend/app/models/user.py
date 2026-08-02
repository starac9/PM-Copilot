"""The `users` table: one row per registered account."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # unique + index: email is how users log in, so lookups must be fast and duplicates
    # must be impossible.
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)

    # We store only the bcrypt hash, never the real password.
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # A user owns many projects. `cascade="all, delete-orphan"` means deleting a user
    # also deletes their projects (and via Project, their PRDs) — no orphan rows left.
    projects: Mapped[list["Project"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
