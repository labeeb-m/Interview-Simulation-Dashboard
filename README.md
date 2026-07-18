# AI Monitor Dashboard 

> Observability platform for AI recruitment agents.

**[Live Demo](https://interview-simulation-dashboard.vercel.app)** ·

---

## Why This Exists

AI Interviewers run 24/7 screening interviews across IT, healthcare, sales, engineering, and more. At scale, things degrade silently, latency creeps up, match scores drop on certain verticals, ATS syncs fail, candidates ghost mid-session. There's no single place to see it.

This dashboard surfaces those signals before they become a support ticket.

---

## What It Tracks

| Signal | What it tells you |
|---|---|
| **Latency (p50/p95/p99)** | Which bots are slow and how bad the worst sessions really are |
| **Cost per interview** | Token spend over time, broken down by vertical |
| **Match score by vertical** | Where Sarah is underperforming: IT vs healthcare vs sales |
| **Flag rate trends** | `salary_mismatch`, `no_response`, `ats_sync_failed`, etc. over time |
| **Bad conversation drilldown** | Filterable table of low-score sessions with transcript snippets |

---

## Architecture
┌─────────────────────────────────────────────────────┐
│ Next.js 14 (Vercel) │
│ Overview · Latency · Cost · Flags · Quality · Convos│
└──────────────────────┬──────────────────────────────┘
│ REST (axios + React Query)
┌──────────────────────▼──────────────────────────────┐
│ FastAPI (Railway) │
│ /api/kpis · /api/latency · /api/cost │
│ /api/flags · /api/match-quality · /api/conversations│
└──────────────────────┬──────────────────────────────┘
│ asyncpg (raw SQL, no ORM)
┌──────────────────────▼──────────────────────────────┐
│ PostgreSQL │
│ interviews · bots · jobs · interview_flags │
└─────────────────────────────────────────────────────┘

text

**Key decisions:**
- **No ORM**: raw SQL via `asyncpg` for full control over query planning and percentile aggregations (`PERCENTILE_CONT`)
- **Period-over-period KPIs**: each metric compares current vs previous window in a single query using time-offset ranges, no double fetching
- **asyncpg connection pool**: min 2 / max 10 connections, initialized at startup via FastAPI lifespan
- **Typed end-to-end**: every API response has a matching TypeScript interface in `lib/api.ts`; no `any` types

---

## Data Model

| Field | Type | Description |
|---|---|---|
| `candidate_id` | TEXT | Anonymized candidate identifier |
| `bot_id` | TEXT | References `bots`: Sarah v1, Sarah Healthcare, etc. |
| `job_id` | TEXT | References `jobs` with vertical tag |
| `duration_ms` | INT | Full interview duration in milliseconds |
| `tokens_used` | INT | Total LLM tokens consumed |
| `cost_usd` | NUMERIC | Estimated cost at $0.002/1k tokens blended |
| `match_score` | NUMERIC | 0.0–1.0 candidate–job fit score |
| `outcome` | TEXT | `shortlisted` · `rejected` · `no_show` · `pending` |
| `flags` | TABLE | Per-interview quality signals with severity levels |

Demo data: 2,200 synthetic interviews seeded with realistic vertical-specific latency profiles, outcome distributions, and flag probabilities correlated to match score.

---

## Local Setup

### 1. Database
```bash
createdb -U postgres your_db
psql -U postgres your_db < backend/schema.sql
```

### 2. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Set DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/your_db

python seed.py
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
# → http://localhost:3000
```

---

## Deploy

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | Set `NEXT_PUBLIC_API_URL` env var |
| Backend | Railway | Set `DATABASE_URL` env var |
| Database | Railway PostgreSQL | Provisioned automatically |

---

## Stack

- **Frontend:** Next.js 14, TypeScript, App Router, Recharts, React Query
- **Backend:** FastAPI, asyncpg, Pydantic v2
- **Database:** PostgreSQL
- **Font:** Satoshi (Fontshare)

---

*Built by [Labeeb Muntasir](https://github.com/labeeb-m)*
