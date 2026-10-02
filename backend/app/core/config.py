"""
Central application configuration.

WHY this file exists:
We never want secrets (API keys, DB passwords, JWT signing key) hard-coded in the
source. Instead we read them from environment variables / a local .env file.
`pydantic-settings` gives us a single typed `settings` object so the rest of the app
can just do `from app.core.config import settings` and read `settings.GEMINI_API_KEY`
with autocomplete and validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All environment-driven configuration for the backend.

    Each attribute maps to an environment variable of the same name. If a variable
    is missing (and has no default here), the app fails fast at startup instead of
    breaking mysteriously later.
    """

    # --- AI: text generation ---
    # LLM_PROVIDER picks which service generates PRDs/stories. Both are wired behind ONE
    # interface (services/llm_service.py), so switching is a config change, not a code
    # change — the whole point of isolating the provider.
    #   "gemini" — Google Gemini (needs GEMINI_API_KEY; free tier is region-limited).
    #   "groq"   — Groq's free API (needs GROQ_API_KEY, no credit card).
    LLM_PROVIDER: str = "gemini"

    # Gemini (optional unless LLM_PROVIDER=gemini).
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"
    # Tried in order after GEMINI_MODEL when it's out of quota / overloaded / retired. Newer
    # models often have little or no free-tier quota, so older Flash models are the safety net.
    GEMINI_FALLBACK_MODELS: str = "gemini-3.7-flash,gemini-3.5-flash,gemini-3.5-flash-lite"

    # Groq (optional unless LLM_PROVIDER=groq). Free key at https://console.groq.com.
    # The Llama models are Enterprise-only on Groq now (free keys get 404); gpt-oss-120b is
    # the free-tier text model and supports JSON mode.
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # --- AI: embeddings (RAG / Phase 4) ---
    # EMBED_PROVIDER picks how document chunks are embedded for vector search.
    #   "local"  — fastembed (bge-small-en, 384-dim). Runs offline, no key, no cost.
    #   "gemini" — Gemini text-embedding-004 (768-dim; requires changing the vector
    #              column dimension + a new migration to match).
    # The vector column dimension is fixed at DDL time (see models/document.py), so the
    # active provider's output dimension MUST equal EMBEDDING_DIM there.
    EMBED_PROVIDER: str = "local"
    GEMINI_EMBED_MODEL: str = "text-embedding-004"

    # --- Database ---
    DATABASE_URL: str

    # --- Auth ---
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"        # symmetric signing; fine for a single backend
    # 7 days. Sessions slide: the frontend calls /auth/refresh on each visit for a fresh token,
    # so active users stay signed in and only a week of inactivity logs you out.
    JWT_EXPIRE_MINUTES: int = 10080

    # Google Sign-In (optional). The OAuth 2.0 Web Client ID from Google Cloud Console.
    # When set, /auth/google verifies Google ID tokens against it. Leave blank to disable.
    GOOGLE_CLIENT_ID: str = ""

    # --- CORS ---
    # The browser blocks requests from other origins unless the server allows them.
    # We only allow our own frontend(s): a comma-separated list of exact origins, plus an
    # optional regex for preview deploys (e.g. ^https://pm-copilot-ai-[a-z0-9-]+\.vercel\.app$).
    FRONTEND_URL: str = "http://localhost:5173"
    FRONTEND_ORIGIN_REGEX: str = ""

    # --- Abuse protection (AI calls cost quota) ---
    # Public chat endpoints are limited per client IP; generation endpoints per user.
    CHAT_RATE_LIMIT_PER_HOUR: int = 30
    GENERATION_RATE_LIMIT_PER_HOUR: int = 40

    # --- Error tracking (optional) ---
    # Set to a Sentry DSN to report unhandled backend errors. Blank = disabled.
    SENTRY_DSN: str = ""

    @property
    def frontend_origins(self) -> list[str]:
        """FRONTEND_URL split into exact origins (trailing slashes would never match)."""
        return [o.strip().rstrip("/") for o in self.FRONTEND_URL.split(",") if o.strip()]

    # Tells pydantic-settings to load values from a local .env file if present.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


# A single shared instance imported everywhere. Created once at import time.
settings = Settings()
