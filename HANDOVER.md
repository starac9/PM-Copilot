# PM Copilot — Handover & Context Document

> **Last updated:** 2026-10-02  
> **Status:** Live (Vercel + Render). All-in-one PM platform: AI workspace, Learn course, PM AI Chat.

---

## 1. Project Overview

**PM Copilot** is an all-in-one product management platform with three pillars:
**Workspace** (do the work), **Learn** (a PM course from scratch), and **PM AI Chat** (ask a mentor).

The **workspace** converts a one-line idea into:

- A structured **PRD** (problem statement, personas, metrics, scope, risks)
- **User stories** with RICE prioritization inputs
- A **sprint roadmap** (deterministic, capacity-aware packing — no LLM)
- **PM Workspace** artifacts (strategy, OKRs, market analysis, GTM, personas, release notes, stakeholder updates, discovery)
- **RAG grounding** — upload PDF/Markdown docs and every generation is grounded in them via pgvector

**Learn** (`/learn`, public): 7 modules / 23 lessons (static data in `frontend/src/learn/`), each
with a 2-question quiz, a "Practice it" link that pre-fills a sample workspace project, and
"Ask PM AI about this lesson" prompts. Progress syncs to the account when signed in.

**PM AI Chat** (`/ask`, public): a streaming PM mentor (`POST /chat/mentor/stream`). Signed-in
users' conversation is saved to their account.

**Stack:**
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL (Neon) + pgvector
- **Frontend:** React 18 + Vite + TanStack Query v5 + react-hook-form + Zod + Tailwind CSS
- **AI:** Google Gemini (primary in production) or Groq — `LLM_PROVIDER` picks who answers first;
  failures fall back through backup models and then the other provider (see §7)
- **Auth:** JWT (email/password) + optional Google OAuth
- **Deploy:** Render (backend) + Vercel (frontend)

---

## 2. Repository Structure

```
PM-Copilot/
├── backend/
│   ├── app/
│   │   ├── core/          # config.py, database.py, security.py
│   │   ├── models/        # SQLAlchemy ORM models (User, Project, PRD, StorySet, Document, Artifact)
│   │   ├── routers/       # FastAPI route handlers (auth, projects, prd, stories, artifacts, documents, export, chat)
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic (llm_service, rag_service, roadmap_service, export_service, prompts)
│   │   ├── deps.py        # Shared FastAPI dependencies (get_current_user)
│   │   └── main.py        # App entry point, CORS, router mounting
│   ├── alembic/           # Database migrations
│   ├── .env.example       # Copy to .env and fill in values
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # client.js — single Axios instance with JWT interceptor
│   │   ├── components/    # Shared UI (AuthForm, Navbar, ProtectedRoute, ChatWidget, ArtifactModal, prd/…)
│   │   ├── context/       # AuthContext, ThemeContext, GoogleProvider
│   │   ├── hooks/         # React Query hooks (useProjects, usePrd, useStories, useArtifacts, useDocuments)
│   │   ├── lib/           # queryClient.js, schemas.js (Zod), toast.js
│   │   ├── pages/         # Landing, Login, Register, Dashboard, ProjectView, StoriesView, RoadmapView, WorkspaceView
│   │   └── utils/         # rice.js (RICE score formula)
│   ├── .env.example       # Copy to .env and fill in values
│   └── package.json
└── HANDOVER.md            # This file (in repo root)
```

---

## 3. Local Development Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY (and/or GROQ_API_KEY)

# Run DB migrations (first time, or after schema changes)
alembic upgrade head

# No Postgres handy? DATABASE_URL=sqlite:///./local.db works for everything except RAG
# retrieval (which then quietly returns no context). Migrations are Postgres-only, so create
# the tables directly instead of running alembic:
#   python -c "from app.core.database import Base, engine; import app.models; Base.metadata.create_all(engine)"

# Start the dev server
uvicorn app.main:app --reload
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# VITE_API_URL=http://localhost:8000 (default, no change needed for local dev)

npm run dev
# Frontend at http://localhost:5173
```

---

## 4. Environment Variables

### Backend `.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (psycopg3: `postgresql+psycopg://…`) |
| `JWT_SECRET` | ✅ | Random secret for signing JWTs (`openssl rand -hex 32`) |
| `GEMINI_API_KEY` | if using Gemini | Google AI Studio key |
| `GROQ_API_KEY` | if using Groq | Groq API key (free at console.groq.com); also enables Groq as a fallback |
| `LLM_PROVIDER` | — | Who answers first: `"gemini"` (production) or `"groq"` (code default) |
| `GEMINI_MODEL` | — | Default `gemini-3.8-flash` |
| `GEMINI_FALLBACK_MODELS` | — | Tried in order on quota/overload/retired model. Default `gemini-3.7-flash,gemini-3.5-flash,gemini-3.5-flash-lite` |
| `GROQ_MODEL` | — | Default `openai/gpt-oss-120b` (Groq's Llama models are Enterprise-only) |
| `EMBED_PROVIDER` | — | `"local"` (default, fastembed offline) or `"gemini"` |
| `FRONTEND_URL` | — | CORS origin(s), comma-separated, no trailing slash. Production: `https://pm-copilot-ai.vercel.app` |
| `FRONTEND_ORIGIN_REGEX` | — | Optional regex to also allow your Vercel preview deploys |
| `CHAT_RATE_LIMIT_PER_HOUR` | — | Public chat questions per IP per hour (default 30) |
| `GENERATION_RATE_LIMIT_PER_HOUR` | — | PRD/story/artifact generations per user per hour (default 40) |
| `SENTRY_DSN` | — | Optional backend error tracking |
| `GOOGLE_CLIENT_ID` | — | Optional Google OAuth client ID |
| `JWT_EXPIRE_MINUTES` | — | Default `10080` (7 days, sliding — see §5) |

### Frontend `.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | — | Backend URL; defaults to `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | — | Optional; enables Google Sign-In button |
| `VITE_SENTRY_DSN` | — | Optional frontend error tracking (SDK only loads when set) |

---

## 5. Authentication Flow

```
User fills login form
  → AuthForm (react-hook-form + Zod credentialsSchema)
  → Login.jsx calls useAuth().login(email, password)
  → AuthContext.authenticate() → POST /auth/login
  → Backend: verifies bcrypt hash → returns {access_token, user}
  → Token stored in localStorage (key: "pmcopilot_token")
  → User object stored in localStorage (key: "pmcopilot_user")
  → React state updated → ProtectedRoute sees isAuthenticated=true
  → navigate back to the page that required login (ProtectedRoute stores it in
    location.state.from; see lib/redirect.js), else /dashboard

On every subsequent API call:
  → axios interceptor reads token from localStorage → sets Authorization: Bearer <token>

On page refresh:
  → AuthContext useEffect (runs once on mount) restores user from localStorage
  → loading=false → ProtectedRoute renders children (no flash to /login)
  → in the background, POST /auth/refresh swaps the token for a fresh 7-day one
    (sliding session). A 401 there signs out quietly; network errors keep the session.

On 401 from any non-auth endpoint:
  → axios interceptor clears localStorage → redirects to /login

On logout:
  → AuthContext.logout() clears localStorage (incl. local Learn progress + chat, which
    live on the account) + React state + the React Query cache
  → SiteNav calls logout() then navigate("/login")

Change password: /account → PUT /auth/password (requires the current password).
```

### Google OAuth Flow

```
User clicks "Continue with Google" button
  → GoogleSignInButton → @react-oauth/google returns credential (ID token)
  → AuthContext.loginWithGoogle(credential) → POST /auth/google
  → Backend: verify_oauth2_token() → find-or-create user → return our JWT
  → Same storage/state update as email login
```

---

## 6. Bugs Fixed (2026-10-02)

### Bug 1 — CRITICAL: Login shows blank page instead of error toast

**File:** `frontend/src/api/client.js`

**Root cause:** The axios 401 response interceptor was catching ALL 401 responses — including `/auth/login` returning 401 for wrong credentials — and redirecting to `/login` before the toast could fire. This caused the login page to hard-reload on every failed login attempt, making login look completely broken.

**Fix:** Added `AUTH_PATHS` check: if the failing request URL is an auth endpoint (`/auth/login`, `/auth/register`, `/auth/google`), skip the redirect. Only redirect on 401s from protected endpoints (expired/invalid session tokens).

```js
// Before (broken):
if (error.response && error.response.status === 401) { redirect... }

// After (fixed):
const isAuthEndpoint = AUTH_PATHS.some((p) => error.config?.url?.includes(p));
if (error.response && error.response.status === 401 && !isAuthEndpoint) { redirect... }
```

---

### Bug 2 — CRITICAL: AuthContext useEffect dependency loop + stale functions

**File:** `frontend/src/context/AuthContext.jsx`

**Root cause:**
1. `useEffect` had `[token]` as dependency. Every `setToken` call (login/logout) re-fired the effect, re-reading localStorage and calling `setUser` again — creating an unnecessary double-update cycle and race condition.
2. `login`, `register`, `loginWithGoogle`, `logout` were plain functions — recreated every render — but included in `useMemo`, meaning the context value object was rebuilt on every render regardless of actual state changes (causing unnecessary consumer re-renders).
3. Corrupted `pmcopilot_user` in localStorage (e.g. partial JSON write) would throw a JSON.parse error with no recovery path, permanently preventing login until localStorage was manually cleared.

**Fix:**
- Changed `useEffect` dependency to `[]` (run once on mount only); reads token from localStorage directly.
- Added try/catch for JSON.parse with cleanup logic (clears bad storage so the user can log in fresh).
- Wrapped all auth functions in `useCallback` for stable references.
- Updated `useMemo` dependencies to include the stable function refs.

---

### Bug 3 — CRITICAL: WorkspaceView crashes when workspace query fails

**File:** `frontend/src/pages/WorkspaceView.jsx`

**Root cause:** The `isError` branch renders `<EmptyState>` but `EmptyState` was never imported. React would throw `ReferenceError: EmptyState is not defined`, causing the ErrorBoundary to show "Something went wrong" instead of the intended error state.

**Fix:** Added `import EmptyState from "../components/EmptyState.jsx"`.

---

### Bug 4 — MEDIUM: Unsafe property access in WorkspaceView

**File:** `frontend/src/pages/WorkspaceView.jsx` line 63

**Root cause:** `data?.catalog.find(...)` — optional chain on `data` but NOT on `catalog`. If `data` exists but `catalog` is missing/undefined (e.g. partial Zod parse), this throws `TypeError: Cannot read properties of undefined (reading 'find')`.

**Fix:** Changed to `data?.catalog?.find(...)`.

---

### Bug 5 — MEDIUM: Artifact model missing from models/__init__.py

**File:** `backend/app/models/__init__.py`

**Root cause:** `Artifact` model was not imported in the `__init__.py` file that Alembic scans. This meant:
- `alembic revision --autogenerate` would NOT detect changes to the `artifacts` table.
- Cold-starting the backend without importing any module that references `artifact.py` could cause SQLAlchemy to fail resolving the `Project.artifacts` relationship.

**Fix:** Added `from app.models.artifact import Artifact  # noqa: F401`.

---

## 7. Architecture — Data Flow

### PRD Generation

```
POST /projects/{id}/prd/generate
  → get_owned_project (ownership check + 404 on wrong user)
  → retrieve_context (RAG: embed query, cosine search in pgvector)
  → generate_prd() → _generate_structured() → Groq/Gemini API
  → Parse JSON → validate against PRDContent Pydantic schema
  → Upsert PRD row (JSONB content column)
  → Return PRDOut + X-Context-Documents header
```

### React Query Cache Strategy

- **`staleTime: 30_000`** — data is fresh for 30 s; navigating away and back shows cached data instantly, then refetches in background
- **`retry: false`** for 4xx — client errors won't fix themselves; no retry spam
- **Cache invalidation:** mutations call `client.invalidateQueries()` or `client.setQueryData()` on related keys
- **Query keys** centralized in `lib/queryClient.js` → `qk.*` — avoids string typos across hooks

### Token Lifecycle

```
Login → localStorage["pmcopilot_token"] = JWT
       localStorage["pmcopilot_user"] = JSON user object

Refresh → AuthContext useEffect reads both on mount → restores session → /auth/refresh

Logout / 401 → both localStorage keys removed → React state null → redirect /login
```

---

## 7b. AI Provider Fallback

Every AI call goes through `llm_service._call_with_fallback` (or `_stream_with_fallback` for
streaming). It walks (provider, model) candidates in order:

1. `LLM_PROVIDER`'s configured model (`GEMINI_MODEL` / `GROQ_MODEL`)
2. that provider's built-in default model (host env vars override code defaults, so a stale
   env var pointing at a retired model can't break everything)
3. `GEMINI_FALLBACK_MODELS` (Gemini only)
4. the other provider, if it has an API key

Any provider error status (bad key, unknown model, quota, overload) moves straight to the
next candidate — no retry, since it won't clear immediately. Only a malformed reply (bad JSON
/ schema mismatch) is retried on the same model. If everything fails, the 502 detail lists
each failure, e.g. `gemini/gemini-3.8-flash: rate limit / quota exceeded (429)`.

Streaming can only fall back **before** the first token; a mid-answer failure appends
"_(The answer was cut off — please try again.)_".

---

## 8. Known Limitations / Future Work

| Area | Issue / Opportunity |
|---|---|
| **Free-tier AI quota** | Gemini free quotas are small and per model (they reset daily). Fallback models absorb this, but heavy traffic can exhaust all of them — enable billing on the key for a public launch. |
| **Rate limits are in-memory** | `core/rate_limit.py` counts per process. Fine for one Render instance; use Redis if you scale out. Counters reset on redeploy. |
| **Password reset** | Signed-in users can change their password; there's no "forgot password" email flow (needs an email provider). |
| **Roadmap persistence** | Sprint roadmap is computed on demand and not stored. |
| **Context window limits** | Very large PRDs + many docs could exceed the model context. Consider trimming RAG chunks. |
| **pgvector on SQLite** | RAG retrieval only works on Postgres; on SQLite it degrades to no context (and rolls back the session). |
| **Keep-alive** | `.github/workflows/keepalive.yml` pings `/health` every 10 min. GitHub pauses scheduled workflows after 60 days with no repo activity. |
| **Google OAuth** | Only works if both `VITE_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` (backend) are set. |

---

## 9. Key Files Quick Reference

| File | Purpose |
|---|---|
| `backend/app/main.py` | FastAPI app factory, CORS middleware, router mounting |
| `backend/app/core/config.py` | All env vars as a typed Pydantic Settings object |
| `backend/app/core/security.py` | bcrypt hashing + JWT sign/verify |
| `backend/app/deps.py` | `get_current_user` — the auth guard injected into all protected routes |
| `backend/app/services/llm_service.py` | All LLM calls (PRD, stories, artifacts, chat, mentor + streaming) with provider/model fallback |
| `backend/app/core/rate_limit.py` | In-memory sliding-window limits: chat per IP, generation per user |
| `backend/app/routers/me.py` | Signed-in user's Learn progress + saved PM AI Chat conversation |
| `backend/app/services/rag_service.py` | Upload → chunk → embed → store → retrieve (pgvector cosine search) |
| `backend/app/services/prompts.py` | All system prompts and per-artifact ARTIFACT_SPECS registry |
| `backend/app/services/roadmap_service.py` | RICE scoring + greedy sprint packing (no LLM) |
| `frontend/src/api/client.js` | Axios instance with JWT interceptor and 401 handler |
| `frontend/src/context/AuthContext.jsx` | Auth state + login/register/logout/Google — shared via React Context |
| `frontend/src/lib/schemas.js` | Zod schemas for both form validation and API response parsing |
| `frontend/src/lib/queryClient.js` | TanStack Query client + `qk` key factory |
| `frontend/src/hooks/usePrd.js` | React Query hooks for PRD CRUD + generation |
| `frontend/src/hooks/useArtifacts.js` | React Query hooks for PM workspace artifact CRUD |
| `frontend/src/components/SiteNav.jsx` | The one platform nav (Workspace · Learn · PM AI Chat) on every page |
| `frontend/src/learn/` | Course data (`modules/*.js`), quizzes, progress sync hook, sidebar |
| `frontend/src/pages/AskView.jsx` | PM AI Chat: streaming via `fetch`, stop button, account sync |

---

## 10. Deployment

### Backend (Render)

- Service type: **Web Service**
- Build command: `pip install -r requirements.txt`
- Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  (migrations run automatically on every deploy; latest is `0005_learning`)
- Python version: **3.11** (set via `render.yaml`)
- Env vars in the Render dashboard: `DATABASE_URL`, `JWT_SECRET`, `LLM_PROVIDER=gemini`,
  `GEMINI_API_KEY`, `FRONTEND_URL=https://pm-copilot-ai.vercel.app` (+ optional ones in §4)

### Frontend (Vercel)

- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL=https://your-backend.onrender.com` in Vercel env vars
- `vercel.json` configures SPA routing (all paths → `index.html`)
- Production URL: **https://pm-copilot-ai.vercel.app** (a second Vercel project, `pm-copilot`,
  also builds this repo but its origin isn't allowed by CORS — it can be deleted)

### CI

- `.github/workflows/ci.yml` runs backend tests (Python 3.11) and the frontend build on every
  push to `main` and every PR.

---

## 11. Adding a New PM Artifact Type

The workspace is data-driven. To add a new artifact type (e.g. `"competitive_analysis"`):

1. **Backend `services/prompts.py`** — Add entry to `ARTIFACT_SPECS`:
   ```python
   "competitive_analysis": {
       "label": "Competitive Analysis",
       "description": "Map competitors, gaps, and positioning.",
       "system": "You are a market analyst. Return structured competitive intelligence.",
   }
   ```
2. **Frontend `pages/WorkspaceView.jsx`** — Add an icon to the `ICONS` map:
   ```js
   competitive_analysis: BarChart2,
   ```
3. ✅ No migration needed — artifacts use a generic `(project_id, type)` table.
4. ✅ No new route needed — the generic `/artifacts/{artifact_type}` routes handle it automatically.

---

*Originally generated by Antigravity on 2026-10-02; updated for the learning platform release.*
