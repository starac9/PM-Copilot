# 🧭 PM Copilot

[![CI](https://github.com/starac9/PM-Copilot/actions/workflows/ci.yml/badge.svg)](https://github.com/starac9/PM-Copilot/actions/workflows/ci.yml)
**Live:** https://pm-copilot-ai.vercel.app

An all-in-one product management platform — **work as a PM, learn the craft, ask the AI**:

- **Workspace** — turn a raw product idea into a structured **PRD**, **user stories** with
  RICE scores, a **sprint roadmap**, PM artifacts (strategy, OKRs, GTM, …), and export
  files — all grounded in your own documents via RAG.
- **Learn** (`/learn`) — a step-by-step course that teaches product management from
  scratch (7 modules, 23 lessons), with a quiz per lesson, progress tracking (synced to your
  account), hands-on practice links into the workspace, and "ask the AI about this lesson".
- **PM AI Chat** (`/ask`) — a full-page PM mentor that streams structured, example-driven
  answers; your conversation is saved to your account.

Built with FastAPI + React + Groq/Gemini.

This is a portfolio project: the code favors **clarity over cleverness** and is heavily
commented to explain the *why* behind each decision.

---

## Architecture

```
┌────────────────────┐        HTTPS/JSON        ┌──────────────────────┐
│  React (Vite) SPA   │  ───────────────────▶   │   FastAPI backend     │
│  Tailwind CSS       │  ◀───────────────────   │                        │
│  - auth (JWT)       │                          │  routers/  (HTTP)      │
│  - dashboard        │                          │  services/ (LLM +      │
│  - PRD viewer/edit  │                          │            RAG — the   │
└────────────────────┘                          │            only code   │
        │  VITE_API_URL                          │            that talks  │
        ▼                                        │            to the LLM) │
   Vercel (static)                               │  models/   (SQLAlchemy)│
                                                 │  schemas/  (Pydantic)  │
                                                 └───────────┬────────────┘
                                                             │
                                                   ┌─────────▼──────────┐
                                                   │ PostgreSQL + pgvector│
                                                   │ (Neon, serverless)   │
                                                   └──────────────────────┘
                                                             │
                                                   ┌─────────▼──────────┐
                                                   │  Groq / Gemini (LLM) │
                                                   │  fastembed (local)   │
                                                   │  or Gemini embeds    │
                                                   └──────────────────────┘
```

**Key design principle — provider isolation:** every LLM call lives in
`services/llm_service.py` (text) and `services/rag_service.py` (embeddings/retrieval).
Swapping providers is a **config change**, not a code change — set `LLM_PROVIDER` to
`gemini` or `groq`, and `EMBED_PROVIDER` to `local` (free, offline) or `gemini`. Routers
never import an AI SDK.

---

## Tech stack

| Layer     | Choice |
|-----------|--------|
| Frontend  | React (Vite), Tailwind CSS, React Router, axios |
| Backend   | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| Database  | PostgreSQL + pgvector (Neon serverless) |
| AI (text) | Provider-isolated: **Groq** (`openai/gpt-oss-120b`, free) or **Gemini** (`gemini-3.8-flash`) |
| AI (embed)| **fastembed** local `bge-small-en` (free, offline) or Gemini `text-embedding-004` |
| Auth      | JWT (email + password), bcrypt password hashing |

---

## Feature phases

- **Phase 1 — Core PRD generation** ✅ auth, projects CRUD, structured PRD generation
  (strict JSON), editable PRD viewer.
- **Phase 2 — User stories & roadmap** ✅ epics → stories with acceptance criteria, RICE
  prioritization computed deterministically in our code, capacity-based sprint roadmap.
- **Phase 3 — Export** ✅ Markdown download, Jira-compatible CSV (fixed priority enum),
  copy-to-clipboard.
- **Phase 4 — RAG context** ✅ upload PDFs/Markdown → chunk → embed → pgvector retrieval
  injected into PRD/story generation, with a "grounded in N docs" indicator.
- **Phase 5 — Learning platform** ✅ public `/learn` course (lessons are plain data in
  `frontend/src/learn/modules/*.js` — add a lesson by adding an object; quizzes live in
  `learn/quizzes.js`) and `/ask` PM AI Chat streamed from `POST /chat/mentor/stream`.
- **Phase 6 — Production hardening** ✅ per-IP / per-user rate limits on AI endpoints,
  Gemini model fallback, sliding 7-day sessions + change password, progress & chat synced
  to the account, optional Sentry, CI on every push, and a keep-alive ping for Render.

---

## Local setup

### Prerequisites
- Python 3.9+ and Node 18+
- A **Groq API key** — free, no credit card, at <https://console.groq.com>
  (or a Gemini key if you set `LLM_PROVIDER=gemini`)
- A **PostgreSQL database with pgvector** — free at <https://neon.tech> (enable the
  `vector` extension; the first migration also runs `CREATE EXTENSION IF NOT EXISTS vector`)
- Embeddings run locally via `fastembed` — no key needed (downloads a ~130MB model once)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env                 # then fill in real values (see below)
alembic upgrade head                 # create tables + enable pgvector
uvicorn app.main:app --reload        # http://localhost:8000  (docs at /docs)
```

`backend/.env`:
```
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=openai/gpt-oss-120b
EMBED_PROVIDER=local
DATABASE_URL=postgresql+psycopg://USER:PASS@HOST/DB?sslmode=require
JWT_SECRET=run: openssl rand -hex 32
JWT_EXPIRE_MINUTES=1440
FRONTEND_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env                 # VITE_API_URL=http://localhost:8000
npm run dev                          # http://localhost:5173
```

### Run the tests (no API key or Postgres needed — the LLM is mocked, tests use SQLite)

```bash
cd backend
.venv/bin/pytest
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/health` | Liveness check (used by uptime pings). |
| POST   | `/auth/register` | Create account → returns JWT + user. |
| POST   | `/auth/login` | Log in → returns JWT + user. |
| POST   | `/projects` | Create a project (product idea). |
| GET    | `/projects` | List the current user's projects. |
| GET    | `/projects/{id}` | Get one project the user owns. |
| DELETE | `/projects/{id}` | Delete a project (cascades to its PRD + stories). |
| POST   | `/projects/{id}/prd/generate` | Generate/regenerate the PRD via the LLM. |
| GET    | `/projects/{id}/prd` | Read the project's PRD. |
| PUT    | `/projects/{id}/prd` | Save edits to the PRD (validated against the schema). |
| POST   | `/projects/{id}/stories/generate` | Generate epics + stories from the PRD. |
| GET    | `/projects/{id}/stories` | Read the project's story set. |
| PUT    | `/projects/{id}/stories` | Save edited stories / RICE inputs. |
| POST   | `/projects/{id}/stories/roadmap` | Build a sprint roadmap from a team capacity. |
| GET    | `/projects/{id}/export/markdown` | Download PRD + stories as Markdown. |
| GET    | `/projects/{id}/export/jira.csv` | Download stories as Jira-importable CSV. |
| POST   | `/projects/{id}/documents` | Upload a PDF/Markdown reference doc (chunk + embed). |
| GET    | `/projects/{id}/documents` | List a project's reference documents. |
| DELETE | `/projects/{id}/documents/{doc_id}` | Delete a document and its chunks. |
| POST   | `/auth/refresh` | Exchange a valid token for a fresh one (sliding session). |
| PUT    | `/auth/password` | Change password (requires the current one). |
| POST   | `/chat` | Public FAQ assistant (landing-page widget). Rate-limited per IP. |
| POST   | `/chat/mentor` | Public PM AI Chat, whole answer; optional `topic` (lesson title). |
| POST   | `/chat/mentor/stream` | Same, streamed as plain-text chunks (used by `/ask`). |
| GET    | `/me/learn-progress` | Lessons the signed-in user completed. |
| POST   | `/me/learn-progress/sync` | Merge browser progress into the account (union). |
| PUT/DELETE | `/me/learn-progress/{slug}` | Mark a lesson complete / not done. |
| GET/PUT/DELETE | `/me/mentor-chat` | The signed-in user's saved PM AI Chat conversation. |

All `/projects...` routes require the `Authorization: Bearer <token>` header and only ever
touch data owned by the authenticated user (others' resources return 404).

---

## Deployment (free tier)

Three free services: **Neon** (database), **Render** (backend), **Vercel** (frontend).

### 1. Database — Neon
1. Create a project at <https://neon.tech>. In the SQL editor run once:
   `CREATE EXTENSION IF NOT EXISTS vector;` (the first migration also does this).
2. Copy the connection string and convert it to psycopg3 form:
   `postgresql+psycopg://USER:PASS@HOST/DB?sslmode=require`. Save it as `DATABASE_URL`.

### 2. Backend — Render
1. Push this repo to GitHub. In Render: **New + → Blueprint**, select the repo. It reads
   [backend/render.yaml](backend/render.yaml) (root dir `backend`).
2. When prompted, set the secret env vars: `GROQ_API_KEY` (free, no card), `DATABASE_URL`
   (from Neon), `JWT_SECRET` (`openssl rand -hex 32`), and `FRONTEND_URL` (your Vercel URL —
   you can set a placeholder first and update it after step 3).
3. Render builds, runs `alembic upgrade head` (pre-deploy), and starts uvicorn on `$PORT`.
   Confirm `https://<your-service>.onrender.com/health` returns `{"status":"ok"}`.
   > Free instances sleep when idle; the first request after a nap is slow. A cron pinging
   > `/health` every ~10 min keeps it warm.

### 3. Frontend — Vercel
1. In Vercel: **Add New → Project**, import the repo, set **Root Directory** to `frontend`
   (framework auto-detects Vite). [frontend/vercel.json](frontend/vercel.json) handles SPA
   routing.
2. Add env var `VITE_API_URL` = your Render backend URL (e.g.
   `https://pm-copilot-api.onrender.com`). Deploy.
3. Copy the resulting Vercel URL back into Render's `FRONTEND_URL` env var (for CORS) and
   redeploy the backend.

That's it — open the Vercel URL, register, and generate your first PRD. 🚀
