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

    # Groq (optional unless LLM_PROVIDER=groq). Free key at https://console.groq.com.
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "mixtral-8x7b-32768"

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
    JWT_EXPIRE_MINUTES: int = 1440       # 24 hours

    # Google Sign-In (optional). The OAuth 2.0 Web Client ID from Google Cloud Console.
    # When set, /auth/google verifies Google ID tokens against it. Leave blank to disable.
    GOOGLE_CLIENT_ID: str = ""

    # --- CORS ---
    # The browser blocks requests from other origins unless the server allows them.
    # We only allow our own frontend.
    FRONTEND_URL: str = "http://localhost:5173"

    # Tells pydantic-settings to load values from a local .env file if present.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


# A single shared instance imported everywhere. Created once at import time.
settings = Settings()
