"""
Import all models here so that Alembic (and SQLAlchemy) can "see" every table when it
scans `Base.metadata`. If a model isn't imported somewhere that runs at startup, Alembic
autogenerate won't know it exists.
"""

from app.models.user import User          # noqa: F401
from app.models.project import Project     # noqa: F401
from app.models.prd import PRD             # noqa: F401
from app.models.story_set import StorySet  # noqa: F401
from app.models.document import Document, DocumentChunk  # noqa: F401
from app.models.artifact import Artifact  # noqa: F401
