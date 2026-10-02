"""learn_progress + mentor_chats tables (learning platform sync)

Revision ID: 0005_learning
Revises: 0004_artifacts
Create Date: 2026-10-02

Hand-written for readability. Stores which lessons each user completed and their current
PM AI Chat conversation, so both follow the user across devices.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0005_learning"
down_revision: Union[str, None] = "0004_artifacts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "learn_progress",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("lesson_slug", sa.String(length=100), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "lesson_slug", name="uq_learn_progress_user_lesson"),
    )
    op.create_index("ix_learn_progress_user_id", "learn_progress", ["user_id"])

    op.create_table(
        "mentor_chats",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("messages", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("topic", sa.String(length=200), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    # unique index enforces one saved conversation per user.
    op.create_index("ix_mentor_chats_user_id", "mentor_chats", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_mentor_chats_user_id", table_name="mentor_chats")
    op.drop_table("mentor_chats")
    op.drop_index("ix_learn_progress_user_id", table_name="learn_progress")
    op.drop_table("learn_progress")
