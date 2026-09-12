# Integration and QA runbook

This is the release gate owned by Participant 4. Run it from a clean clone after the Agent, Backend/Data, and Frontend pull requests have been merged into `develop`.

## Contract decision required before merging

The supplied P1 ↔ P2 and P1/P2 ↔ P3 contracts are the integration source of truth. The repository's current `docs/agent-tool-contract.md` and `docs/agent-events.md` are bootstrap drafts and do not yet match them. The owners must align the following before integration:

| Area | Supplied contract | Current repository draft |
| --- | --- | --- |
| Tool response | `status`, `data`, and `metadata` envelope | direct payload fields |
| `query_database` | `dataset`, filters, grouping, metrics, limit | `query` and filters |
| Recovery authorization | valid `approval_id` | `approved: true` plus `approval_id` |
| Verification input | `incident_id`, `action_id`, and named checks | `incident_id` only |
| Event envelope | `event_id`, `type`, `investigation_id`, `timestamp`, `data` | `id`, `status`, plus different data fields |
| Impact naming | `estimated_business_impact`, `currency` | `estimated_loss`, `affected_region` |

Do not solve these discrepancies in adapters or UI code. Update the shared contract deliberately, then update mocks, implementation, and tests in the same pull request.

## Local release check

1. Copy `.env.example` to `.env`; do not add credentials to it for this demo.
2. Install dependencies and start the backend and frontend as described in the README.
3. In a separate PowerShell window, run the health gate:

   ```powershell
   .\scripts\verify-demo.ps1
   ```

4. Once the investigation endpoints are merged, run the full backend gate:

   ```powershell
   .\scripts\verify-demo.ps1 -RequireFullFlow
   ```

5. Run `npm run lint` and `npm run build`.
6. In a clean browser session, perform the demo script in `demo/demo-script.md`.

## Acceptance checklist

- [ ] `GET /health` returns the documented service and version.
- [ ] A user request creates one investigation with `CREATED` status.
- [ ] The agent uses real tool results for sales, anomaly, logs, and impact.
- [ ] Every tool result validates against the agreed envelope, including errors.
- [ ] The UI receives and renders the official events in sequence.
- [ ] The root cause references existing findings and includes evidence.
- [ ] A recovery cannot execute without a valid approval ID.
- [ ] Rejecting recovery leaves the incident unresolved and does not mutate data.
- [ ] Approving recovery emits action and verification activity.
- [ ] `RESOLVED` is displayed only after `verify_result` returns `verified: true`.
- [ ] A fresh clone runs without manual data editing or secrets.
- [ ] No `.env`, token, local database, build artifact, or personal data is tracked.

## Demo fallback

Before presenting, keep a second terminal open with the health and full-flow checks already run. If live streaming fails, reload the investigation state through `GET /api/investigations/{investigation_id}` and present the persisted findings, approval, action, and verification. Do not claim resolution if the verification object is absent or `verified` is false.
