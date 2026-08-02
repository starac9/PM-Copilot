"""
Application entry point: creates the FastAPI app, configures CORS, mounts routers, and
exposes a /health check.

Run locally with:  uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import artifacts, auth, chat, documents, export, prd, projects, stories

app = FastAPI(
    title="PM Copilot API",
    description="Turn product ideas into PRDs, user stories, and roadmaps with Gemini.",
    version="0.1.0",
)

# CORS: browsers block cross-origin API calls unless the server opts in. We allow ONLY
# our frontend's origin (from the FRONTEND_URL env var) — not "*" — so random sites
# can't call the API with a user's credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Custom header the browser is otherwise not allowed to read; it tells the frontend
    # which uploaded documents grounded a generation (Phase 4 / RAG).
    expose_headers=["X-Context-Documents"],
)

# Mount the feature routers. Order doesn't matter; prefixes keep paths unique.
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(prd.router)
app.include_router(stories.router)
app.include_router(export.router)
app.include_router(documents.router)
app.include_router(artifacts.router)
app.include_router(chat.router)


@app.get("/health", tags=["health"])
def health() -> dict:
    """Lightweight liveness check.

    Used by uptime pingers (and Render) to confirm the service is up. It does NOT touch
    the database, so it stays fast and can't be taken down by a slow DB.
    """
    return {"status": "ok"}
