"""Deterministic data tools for the RootCause AI demo scenario."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4


def _metadata(tool: str) -> dict[str, str]:
    return {"tool": tool, "execution_id": f"EXEC-{uuid4().hex[:8].upper()}", "timestamp": datetime.now(timezone.utc).isoformat()}


def success(tool: str, data: dict) -> dict:
    return {"status": "success", "data": data, "metadata": _metadata(tool)}


def failure(tool: str, code: str, message: str, retryable: bool = False) -> dict:
    return {"status": "error", "error": {"code": code, "message": message, "retryable": retryable}, "metadata": _metadata(tool)}


def query_database(dataset: str, **_filters: object) -> dict:
    if dataset != "sales":
        return failure("query_database", "VALIDATION_ERROR", "Only the sales dataset is available in this demo.")
    return success("query_database", {"columns": ["sale_date", "total_sales"], "rows": [{"sale_date": "2026-09-12", "total_sales": 62000}], "row_count": 1})


def detect_anomaly(metric: str, **_filters: object) -> dict:
    if metric != "sales":
        return failure("detect_anomaly", "VALIDATION_ERROR", "Only sales can be analysed in this demo.")
    return success("detect_anomaly", {"is_anomaly": True, "actual_value": 62000, "expected_value": 100000, "deviation_percentage": -38, "confidence": 0.96})


def analyze_logs(process_name: str, **_filters: object) -> dict:
    if process_name != "inventory_etl":
        return failure("analyze_logs", "NOT_FOUND", "Process was not found.")
    return success("analyze_logs", {"events_found": 1, "events": [{"timestamp": "2026-09-12T08:31:22Z", "level": "ERROR", "process": "inventory_etl", "error_code": "DUPLICATE_RECORD", "message": "Duplicate record detected", "details": {"table": "inventory", "record_id": "INV-12345"}}]})


def calculate_impact(incident_id: str, **_filters: object) -> dict:
    if incident_id != "INC-001":
        return failure("calculate_impact", "NOT_FOUND", "Incident was not found.")
    return success("calculate_impact", {"records_affected": 12453, "estimated_business_impact": 125000, "currency": "USD", "affected_regions": ["ASU", "LAMB", "CDE"], "affected_period_minutes": 137})


def execute_recovery(incident_id: str, approval_id: str) -> dict:
    if incident_id != "INC-001" or not approval_id:
        return failure("execute_recovery", "APPROVAL_INVALID", "A valid approval is required.")
    return success("execute_recovery", {"action_id": "ACT-001", "action": "REPROCESS_ETL", "records_processed": 12453, "started_at": "2026-09-12T15:05:00Z", "completed_at": "2026-09-12T15:05:08Z"})


def verify_result(incident_id: str, action_id: str) -> dict:
    if incident_id != "INC-001" or action_id != "ACT-001":
        return failure("verify_result", "VERIFICATION_FAILED", "Recovery action was not found.")
    return success("verify_result", {"verified": True, "checks": {"sales_recovered": True, "inventory_complete": True, "etl_success": True}, "before_value": 62000, "after_value": 99400, "verification_message": "Incident successfully resolved"})
