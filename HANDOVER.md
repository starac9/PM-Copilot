# PM Copilot — Handover & Context Document

> **Last updated:** 2026-10-02  
> **Status:** All critical bugs fixed. App is runnable locally.

---

## 1. Project Overview

**PM Copilot** is an AI-powered product management tool that converts a one-line idea into:

- A structured **PRD** (problem statement, personas, metrics, scope, risks)
- **User stories** with RICE prioritization inputs
- A **sprint roadmap** (deterministic, capacity-aware packing — no LLM)
- **PM Workspace** artifacts (strategy, OKRs, market analysis, GTM, personas, release notes, stakeholder updates, discovery)
- **RAG grounding** — upload PDF/Markdown docs and every generation is grounded in them via pgvector

**Stack:**
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL (Neon) + pgvector
- **Frontend:** React 18 + Vite + TanStack Query v5 + react-hook-form + Zod + Tailwind CSS
- **AI:** Groq (default, free) or Google Gemini — swappable via `LLM_PROVIDER` env var
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
# Edit .env: fill in DATABASE_URL, JWT_SECRET, GROQ_API_KEY (or GEMINI_API_KEY)

# Run DB migrations (first time, or after schema changes)
alembic upgrade head

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
| `GROQ_API_KEY` | if using Groq | Groq API key (free at console.groq.com) |
| `GEMINI_API_KEY` | if using Gemini | Google AI Studio key |
| `LLM_PROVIDER` | — | `"groq"` (default) or `"gemini"` |
| `EMBED_PROVIDER` | — | `"local"` (default, fastembed offline) or `"gemini"` |
| `FRONTEND_URL` | — | CORS origin; `http://localhost:5173` for local dev |
| `GOOGLE_CLIENT_ID` | — | Optional Google OAuth client ID |
| `JWT_EXPIRE_MINUTES` | — | Default `1440` (24 h) |

### Frontend `.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | — | Backend URL; defaults to `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | — | Optional; enables Google Sign-In button |

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
  → navigate("/dashboard")

On every subsequent API call:
  → axios interceptor reads token from localStorage → sets Authorization: Bearer <token>

On page refresh:
  → AuthContext useEffect (runs once on mount) restores user from localStorage
  → loading=false → ProtectedRoute renders children (no flash to /login)

On 401 from any non-auth endpoint:
  → axios interceptor clears localStorage → redirects to /login

On logout:
  → AuthContext.logout() clears localStorage + React state
  → Navbar calls logout() then navigate("/login")
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

Refresh → AuthContext useEffect reads both on mount → restores session

Logout / 401 → both localStorage keys removed → React state null → redirect /login
```

---

## 8. Known Limitations / Future Work

| Area | Issue / Opportunity |
|---|---|
| **Token refresh** | JWT expires after 24h. No refresh token — user must log in again. Consider implementing sliding window or refresh tokens for better UX. |
| **Offline support** | No service worker. Cached React Query data shows on revisit but no offline writes. |
| **Roadmap persistence** | Sprint roadmap is computed on demand and not stored. Changing RICE inputs and rebuilding can change the roadmap unexpectedly. Consider persisting. |
| **Context window limits** | For large PRDs with many uploaded docs, the Groq/Gemini context window can be exceeded. Consider trimming RAG chunks more aggressively. |
| **pgvector on SQLite** | The `cosine_distance()` call in `rag_service.py` fails on SQLite (used in tests). Tests should mock `retrieve_context` or use a PostgreSQL test DB. |
| **Rate limiting** | No rate limiting on `/chat` or generation endpoints. A public deployment should add `slowapi` or similar. |
| **Google OAuth** | Only works if both `VITE_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` (backend) are set. The frontend silently hides the button if unconfigured — which is intentional. |

---

## 9. Key Files Quick Reference

| File | Purpose |
|---|---|
| `backend/app/main.py` | FastAPI app factory, CORS middleware, router mounting |
| `backend/app/core/config.py` | All env vars as a typed Pydantic Settings object |
| `backend/app/core/security.py` | bcrypt hashing + JWT sign/verify |
| `backend/app/deps.py` | `get_current_user` — the auth guard injected into all protected routes |
| `backend/app/services/llm_service.py` | All LLM calls (PRD, stories, artifacts, chat) — single interface, two providers |
| `backend/app/services/rag_service.py` | Upload → chunk → embed → store → retrieve (pgvector cosine search) |
| `backend/app/services/prompts.py` | All system prompts and per-artifact ARTIFACT_SPECS registry |
| `backend/app/services/roadmap_service.py` | RICE scoring + greedy sprint packing (no LLM) |
| `frontend/src/api/client.js` | Axios instance with JWT interceptor and 401 handler |
| `frontend/src/context/AuthContext.jsx` | Auth state + login/register/logout/Google — shared via React Context |
| `frontend/src/lib/schemas.js` | Zod schemas for both form validation and API response parsing |
| `frontend/src/lib/queryClient.js` | TanStack Query client + `qk` key factory |
| `frontend/src/hooks/usePrd.js` | React Query hooks for PRD CRUD + generation |
| `frontend/src/hooks/useArtifacts.js` | React Query hooks for PM workspace artifact CRUD |

---

## 10. Deployment

### Backend (Render)

- Service type: **Web Service**
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Python version: **3.11** (set via `render.yaml`)
- Set all env vars in Render dashboard (`DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `FRONTEND_URL`=your Vercel URL)
- Run `alembic upgrade head` after deploying schema changes (use Render Shell)

### Frontend (Vercel)

- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL=https://your-backend.onrender.com` in Vercel env vars
- `vercel.json` configures SPA routing (all paths → `index.html`)

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

*Generated by Antigravity on 2026-10-02.*
