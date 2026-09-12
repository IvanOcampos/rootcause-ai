# Architecture

## Phase 1

RootCause AI has two independently deployable services:

- **Frontend:** Next.js App Router, React, TypeScript, and Tailwind CSS.
- **Backend:** FastAPI, exposing a versioned health endpoint.

The frontend reads `NEXT_PUBLIC_API_URL` so it can target a local or deployed backend. The backend will gain the agent orchestration layer, structured events, tool adapters, and SQLite repository in later phases.

## Target flow

`User → Agent → SQL / anomaly / log tools → impact analysis → approval → recovery tool → verifier → resolution`

Tool outputs and agent events will be structured objects, so the command center can render evidence without treating model prose as system state.
