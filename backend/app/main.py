"""
Application entry point: creates the FastAPI app, configures CORS, mounts routers, and
exposes a /health check.

Run locally with:  uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import artifacts, auth, chat, documents, export, me, prd, projects, stories

# Optional error tracking: only active when SENTRY_DSN is set, so local dev and tests never
# send anything anywhere.
if settings.SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.0, send_default_pii=False)

app = FastAPI(
    title="PM Copilot API",
    description="All-in-one PM platform: AI workspace, PM course, and PM AI Chat.",
    version="0.1.0",
)

# CORS: browsers block cross-origin API calls unless the server opts in. We allow ONLY
# our frontend's origins (FRONTEND_URL, comma-separated, plus an optional preview-deploy
# regex) — not "*" — so random sites can't call the API with a user's credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_origin_regex=settings.FRONTEND_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Headers the browser is otherwise not allowed to read cross-origin: which uploaded
    # documents grounded a generation (RAG), and the export download's filename.
    expose_headers=["X-Context-Documents", "Content-Disposition"],
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
app.include_router(me.router)


@app.get("/health", tags=["health"])
def health() -> dict:
    """Lightweight liveness check.

    Used by uptime pingers (and Render) to confirm the service is up. It does NOT touch
    the database, so it stays fast and can't be taken down by a slow DB.
    """
    return {"status": "ok"}
