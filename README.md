# RootCause AI

RootCause AI is an autonomous incident-investigation agent demo. It traces a business anomaly through evidence, proposes recovery, waits for human approval, performs the approved action, and verifies the result before resolving the incident.

## Status

Phase 1 bootstrap is complete: the Next.js frontend and FastAPI backend are independently runnable. The database schema, demo data, investigation tools, agent workflow, and command-center UI arrive in the following phases.

## Architecture

```
Browser (Next.js) ──HTTP──> FastAPI ──> Agent / tools / SQLite
```

The service boundary keeps the simulated SQLite data layer replaceable with production systems later.

## Setup

Requirements: Node.js 20+ and Python 3.11+.

```bash
cp .env.example .env
npm install --prefix frontend
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
```

## Run

In one terminal, run the API:

```bash
backend/.venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000
```

In another terminal, run the frontend:

```bash
npm run dev
```

Open http://localhost:3000. The backend health check is at http://localhost:8000/health.

For participant 3 frontend work, the UI can run without the backend by keeping mocks enabled:

```bash
NEXT_PUBLIC_USE_MOCKS=true
```

When the backend implements the official investigation and SSE contracts, switch the frontend to live mode:

```bash
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Environment

Copy `.env.example` to `.env`. No secrets are required for the local demo. `NEXT_PUBLIC_USE_MOCKS` controls whether the command center replays the contract-compatible mock scenario or calls the live API. `ROOTCAUSE_DATABASE_URL` will be used when the SQLite data layer is added.

## Demo data and full scenario

These are introduced in phases 2–6. The intended scenario investigates a 38% sales drop caused by an ETL failure from duplicate records, then isolates, reprocesses, and verifies recovery after explicit approval.
