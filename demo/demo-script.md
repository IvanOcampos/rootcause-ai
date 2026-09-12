# RootCause AI — demo script (2 minutes)

## Before recording

- Start the backend and frontend from a clean demo dataset.
- Run `scripts/verify-demo.ps1 -RequireFullFlow` once, then reset the demo dataset.
- Open the Command Center and keep a terminal with the health check visible off-camera.
- Never display `.env`, keys, terminal history, or real customer data.

## Presenter script

| Time | Screen action | What to say |
| --- | --- | --- |
| 0:00–0:15 | Show the sales alert and Command Center. | “Sales are 38% below normal. RootCause AI does more than summarize the alert: it investigates with evidence, proposes a safe recovery, and verifies the result.” |
| 0:15–0:40 | Submit: **“Investiga por qué las ventas están 38% por debajo de lo normal.”** Show agent activity. | “The agent queries the sales data, compares it to the historical baseline, and confirms the anomaly.” |
| 0:40–1:05 | Show log and finding events. | “It then correlates the business signal with the inventory ETL logs. The evidence points to duplicate records that stopped processing.” |
| 1:05–1:25 | Show root cause and impact. | “The root cause is explicit and traceable to the findings. We can see 12,453 affected records and the estimated business impact.” |
| 1:25–1:38 | Show the recovery approval card. | “RootCause AI does not mutate the system on its own. It proposes reprocessing the ETL and waits for my approval.” |
| 1:38–1:53 | Approve. Show action and verification events. | “After approval, it isolates duplicates, reprocesses the ETL, and independently verifies that sales recovered.” |
| 1:53–2:00 | Show **Incident Resolved** and verification values. | “The incident is resolved only because verification passed—before 62,000, after 99,400. That is an auditable, human-controlled recovery.” |

## Recovery if the live flow fails

Use the persisted investigation detail view or `GET /api/investigations/{investigation_id}` to show the last successful investigation. State that it is a recorded reproducible scenario; do not fabricate a completed recovery.
