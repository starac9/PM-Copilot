"""
Shared pytest setup.

WHY this file: tests should run anywhere with NO real database and NO real Gemini key.
So here we:
  1. Set dummy environment variables BEFORE importing the app (settings loads at import).
  2. Point the app at an in-memory SQLite DB (fast, disposable) via a dependency override.
  3. Expose a `client` fixture (a fake HTTP client) and an `auth_headers` helper so each
     test starts from a clean, logged-in state.
"""

import os

# These MUST be set before importing anything from `app`, because app.core.config reads
# them at import time. They are fake — no network calls happen with them at import.
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("DATABASE_URL", "sqlite://")  # overridden below anyway
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
# NOTE: importing app.main above already imports every router, which imports every model,
# so all tables are registered on Base.metadata. We must NOT do `import app.models` here —
# that would rebind the name `app` from the FastAPI instance to the package module.

# One shared in-memory SQLite DB for the whole test session. StaticPool keeps it alive
# across connections (a fresh :memory: DB per connection would forget our tables).
_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSession = sessionmaker(bind=_engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def _fresh_db():
    """Create all tables before each test and drop them after, so tests never leak state."""
    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture
def client():
    """A TestClient whose get_db dependency uses our SQLite session instead of Postgres."""

    def _override_get_db():
        db = _TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Register a user and return an Authorization header for authenticated requests."""
    resp = client.post(
        "/auth/register",
        json={"email": "pm@example.com", "password": "secret123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# A realistic, schema-valid PRD used to fake Gemini's output in tests.
FAKE_PRD = {
    "problem_statement": "Solo founders waste hours writing PRDs by hand.",
    "personas": [
        {
            "name": "Busy Solo Founder",
            "description": "Runs a startup alone and context-switches constantly.",
            "pain_points": ["No time to write docs", "Ideas stay unstructured"],
        }
    ],
    "success_metrics": [
        "Reduce PRD drafting time by 70%",
        "500 PRDs generated in first month",
        "40% weekly active retention",
    ],
    "scope": {
        "in_scope": ["Generate PRD from an idea", "Edit sections"],
        "out_of_scope": ["Real-time collaboration"],
    },
    "risks_and_assumptions": ["Users trust AI-drafted content", "Gemini stays affordable"],
}

# A realistic, schema-valid PM artifact (uniform summary + sections shape) for mocking.
FAKE_ARTIFACT = {
    "summary": "A focused strategy: own solo founders who need PRDs fast.",
    "sections": [
        {"title": "Vision", "body": ["Be the fastest path from idea to shipped plan."]},
        {"title": "Strategic pillars", "body": ["Speed", "Trust in AI output", "Zero setup"]},
    ],
}
