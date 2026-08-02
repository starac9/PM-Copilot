"""artifacts table (end-to-end PM workspace)

Revision ID: 0004_artifacts
Revises: 0003_documents
Create Date: 2026-07-18

Hand-written for readability. Adds one table storing generic PM artifacts (strategy, market
analysis, OKRs, personas, GTM, release notes, stakeholder updates, discovery) as a uniform
JSONB document — one row per (project, type).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004_artifacts"
down_revision: Union[str, None] = "0003_documents"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "artifacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        # At most one artifact of each type per project (regenerate overwrites).
        sa.UniqueConstraint("project_id", "type", name="uq_artifact_project_type"),
    )
    op.create_index("ix_artifacts_project_id", "artifacts", ["project_id"])


def downgrade() -> None:
    op.drop_index("ix_artifacts_project_id", table_name="artifacts")
    op.drop_table("artifacts")
