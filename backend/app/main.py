from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from . import demo_tools

app = FastAPI(title="RootCause AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INVESTIGATIONS: dict[str, dict[str, Any]] = {}


class InvestigationRequest(BaseModel):
    user_request: str = Field(min_length=8, max_length=1000)


class ApprovalRequest(BaseModel):
    decision: str


def event(investigation_id: str, event_type: str, data: dict[str, Any]) -> dict[str, Any]:
    return {"event_id": f"EV-{uuid4().hex[:8].upper()}", "type": event_type, "investigation_id": investigation_id, "timestamp": datetime.now(timezone.utc).isoformat(), "data": data}


def tool_data(result: dict[str, Any]) -> dict[str, Any]:
    if result["status"] != "success":
        raise RuntimeError(result["error"]["message"])
    return result["data"]


def investigation_events(investigation_id: str, incident_id: str, request: str) -> tuple[list[dict], dict]:
    sales = tool_data(demo_tools.query_database("sales"))
    anomaly = tool_data(demo_tools.detect_anomaly("sales"))
    logs = tool_data(demo_tools.analyze_logs("inventory_etl"))
    impact = tool_data(demo_tools.calculate_impact(incident_id))
    findings = [
        {"finding_id": "F-001", "type": "ANOMALY", "title": "Sales dropped 38%", "description": "Today is at 62,000 against a 100,000 expected baseline.", "confidence": anomaly["confidence"]},
        {"finding_id": "F-002", "type": "LOG_EVIDENCE", "title": "Inventory ETL stopped", "description": "Process inventory_etl failed at 08:31 with DUPLICATE_RECORD.", "confidence": 0.94},
    ]
    root_cause = {"type": "DUPLICATE_RECORDS", "title": "Duplicate records caused ETL failure", "description": "Duplicate inventory records stopped the ETL and left sales reports incomplete.", "confidence": 0.94, "evidence": ["F-001", "F-002"]}
    recovery = {"approval_id": "APR-001", "action": "REPROCESS_ETL", "title": "Reprocess inventory ETL", "reason": "Restore missing inventory data", "estimated_records": impact["records_affected"], "risk": "LOW"}
    events = [
        event(investigation_id, "investigation_started", {"message": "Investigation started", "user_request": request}),
        event(investigation_id, "tool_started", {"tool": "query_database", "label": "Analyzing sales performance"}),
        event(investigation_id, "tool_completed", {"tool": "query_database", "status": "success", "label": "Sales data loaded", "output": sales}),
        event(investigation_id, "tool_started", {"tool": "detect_anomaly", "label": "Comparing historical baseline"}),
        event(investigation_id, "tool_completed", {"tool": "detect_anomaly", "status": "success", "label": "Sales anomaly detected", "output": anomaly}),
        event(investigation_id, "finding_created", findings[0]),
        event(investigation_id, "tool_started", {"tool": "analyze_logs", "label": "Checking inventory ETL logs"}),
        event(investigation_id, "tool_completed", {"tool": "analyze_logs", "status": "success", "label": "Duplicate record error found", "output": logs}),
        event(investigation_id, "finding_created", findings[1]),
        event(investigation_id, "root_cause_found", root_cause),
        event(investigation_id, "impact_calculated", impact),
        event(investigation_id, "approval_required", recovery),
    ]
    return events, {"findings": findings, "root_cause": root_cause, "impact": impact, "recovery": recovery}


def public(record: dict[str, Any]) -> dict[str, Any]:
    return {key: record[key] for key in ("investigation_id", "incident_id", "status", "user_request", "findings", "root_cause", "impact", "recovery", "verification")}


@app.get("/health")
def health() -> dict[str, str]:
    """Readiness endpoint for the local demo and deployment checks."""
    return {"status": "ok", "service": "rootcause-api", "version": app.version}


@app.post("/api/investigations", status_code=201)
def create_investigation(payload: InvestigationRequest) -> dict[str, str]:
    investigation_id, incident_id = f"INV-{uuid4().hex[:6].upper()}", "INC-001"
    events, evidence = investigation_events(investigation_id, incident_id, payload.user_request)
    INVESTIGATIONS[investigation_id] = {"investigation_id": investigation_id, "incident_id": incident_id, "status": "WAITING_APPROVAL", "user_request": payload.user_request, **evidence, "verification": None, "events": events, "recovery_events": [], "approval_status": "PENDING"}
    return {"investigation_id": investigation_id, "incident_id": incident_id, "status": "CREATED"}


@app.get("/api/investigations/{investigation_id}")
def get_investigation(investigation_id: str) -> dict[str, Any]:
    record = INVESTIGATIONS.get(investigation_id)
    if not record:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return public(record)


@app.get("/api/investigations/{investigation_id}/events")
async def stream_events(investigation_id: str) -> StreamingResponse:
    record = INVESTIGATIONS.get(investigation_id)
    if not record:
        raise HTTPException(status_code=404, detail="Investigation not found")
    events = record["recovery_events"] if record["approval_status"] in {"APPROVED", "REJECTED"} else record["events"]

    async def generate():
        for item in events:
            yield f"event: {item['type']}\ndata: {json.dumps(item)}\n\n"
            await asyncio.sleep(0.28)

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@app.post("/api/investigations/{investigation_id}/approvals/{approval_id}")
def submit_approval(investigation_id: str, approval_id: str, payload: ApprovalRequest) -> dict[str, str]:
    record = INVESTIGATIONS.get(investigation_id)
    if not record:
        raise HTTPException(status_code=404, detail="Investigation not found")
    if approval_id != record["recovery"]["approval_id"]:
        raise HTTPException(status_code=400, detail="Invalid approval")
    if payload.decision not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=422, detail="Decision must be APPROVED or REJECTED")
    if record["approval_status"] != "PENDING":
        raise HTTPException(status_code=409, detail="Approval was already decided")
    record["approval_status"] = payload.decision
    if payload.decision == "REJECTED":
        record["status"] = "CANCELLED"
        record["recovery_events"] = [event(investigation_id, "investigation_failed", {"error_code": "RECOVERY_REJECTED", "message": "Recovery was rejected by the user"})]
        return {"approval_id": approval_id, "status": "REJECTED"}
    action = tool_data(demo_tools.execute_recovery(record["incident_id"], approval_id))
    result = tool_data(demo_tools.verify_result(record["incident_id"], action["action_id"]))
    verification = {"verification_id": "VER-001", "status": "PASSED", **result}
    record["verification"], record["status"] = verification, "RESOLVED"
    record["recovery_events"] = [
        event(investigation_id, "action_started", {"action_id": action["action_id"], "action": action["action"], "label": "Reprocessing inventory ETL"}),
        event(investigation_id, "action_completed", {"action_id": action["action_id"], "status": "SUCCESS", "records_processed": action["records_processed"]}),
        event(investigation_id, "verification_started", {"action_id": action["action_id"], "label": "Verifying recovery"}),
        event(investigation_id, "incident_resolved", {"message": "Incident successfully resolved", "verification_id": "VER-001", "verification": verification}),
    ]
    return {"approval_id": approval_id, "status": "APPROVED"}
