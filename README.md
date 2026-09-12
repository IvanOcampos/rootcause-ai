# RootCause AI

RootCause AI is an incident-investigation agent demo. Given a business anomaly, it gathers operational evidence, identifies the likely root cause, estimates impact, proposes a recovery, waits for a person to approve it, and verifies the outcome before marking the incident resolved.

The MVP demonstrates one reproducible scenario: sales fall 38% below normal because duplicate records stop the inventory ETL. The agent connects that evidence to an impact estimate, reprocesses the ETL only after approval, and verifies the recovery.

## Architecture

```text
Browser / Command Center
          │ HTTP + event stream
          ▼
FastAPI API ── Agent orchestration ── Contracted tools ── SQLite demo data
```

The frontend displays state and user decisions. It does not diagnose, query the database, or decide whether an incident is resolved. A resolution is valid only after the verification tool returns `verified: true`.

## Prerequisites

- Node.js 20 or newer
- Python 3.11 or newer
- PowerShell 7+ (recommended for the integration gate on Windows)

## Local setup

Copy the environment template. The local demo has no required secrets.

```powershell
Copy-Item .env.example .env
npm ci --prefix frontend
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
```

On macOS/Linux, activate the virtual environment or use `backend/.venv/bin/python` instead.

## Run

In one terminal, start the API:

```powershell
backend/.venv/Scripts/python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

In another terminal, start the frontend:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The health endpoint is [http://localhost:8000/health](http://localhost:8000/health).

## Checks

Run the frontend checks:

```powershell
npm run lint
npm run build
```

Run the backend smoke test while it is running:

```powershell
.\scripts\verify-demo.ps1
```

After the agent, backend/data, and frontend feature branches are integrated, verify the complete workflow:

```powershell
.\scripts\verify-demo.ps1 -RequireFullFlow
```

The full-flow gate checks creation, evidence and the approval stop, approved recovery, and verified resolution. The test assumes the official API contract in the supplied team agreements; see [docs/integration-qa.md](docs/integration-qa.md) for the compatibility gate.

## Demo

Use the exact scenario and narration in [demo/demo-script.md](demo/demo-script.md). It is designed for a two-minute presentation and includes a truthful fallback if the live event stream fails.

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

## Security and demo data

Do not commit `.env`, API keys, credentials, local databases, or personal data. All data used in the demo must be synthetic and reproducible from the repository.
