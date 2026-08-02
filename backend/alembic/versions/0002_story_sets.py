"""story_sets table (Phase 2: user stories)

Revision ID: 0002_story_sets
Revises: 0001_initial
Create Date: 2026-07-14

Hand-written for readability. Adds one table storing a project's epics + user stories as
a single JSONB document (one per project), mirroring the prds table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002_story_sets"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "story_sets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
    )
    # unique index enforces the 1-project-1-story-set rule at the DB level.
    op.create_index("ix_story_sets_project_id", "story_sets", ["project_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_story_sets_project_id", table_name="story_sets")
    op.drop_table("story_sets")
