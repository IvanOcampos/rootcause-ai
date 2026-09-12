import type {
  AgentEvent,
  CreateInvestigationResponse,
  FinalReport,
  Investigation,
  InvestigationStatus,
  Verification,
} from "./contracts";

export const MOCK_INVESTIGATION_ID = "INV-001";
export const MOCK_INCIDENT_ID = "INC-001";
export const DEFAULT_DEMO_REQUEST =
  "Investiga por que las ventas estan 38% por debajo de lo normal.";

export const MOCK_VERIFICATION: Verification = {
  verification_id: "VER-001",
  status: "PASSED",
  verified: true,
  checks: {
    sales_recovered: true,
    inventory_complete: true,
    etl_success: true,
  },
  before_value: 62000,
  after_value: 99400,
  verification_message: "Incident successfully resolved",
};

export const MOCK_FINAL_REPORT: FinalReport = {
  title: "Incident resolved — verified recovery",
  executive_summary:
    "Sales were 38% below baseline because duplicate inventory records stopped the inventory ETL. After approval, 12,453 records were reprocessed and recovery was verified.",
  analysis: [
    { label: "Signal", detail: "Sales measured 62,000 against an expected 100,000 baseline." },
    { label: "Correlation", detail: "inventory_etl logged DUPLICATE_RECORD during the affected window." },
    { label: "Root cause", detail: "Duplicate inventory records stopped downstream ETL processing." },
    { label: "Outcome", detail: "Sales, inventory completeness, and ETL health passed verification." },
  ],
  recommended_prevention: "Validate duplicates before ingestion and alert on failed ETL runs.",
};

export function createMockInvestigation(): CreateInvestigationResponse {
  return {
    investigation_id: MOCK_INVESTIGATION_ID,
    incident_id: MOCK_INCIDENT_ID,
    status: "CREATED",
  };
}

export function getMockInvestigation(
  userRequest: string,
  status: InvestigationStatus = "CREATED",
): Investigation {
  return {
    investigation_id: MOCK_INVESTIGATION_ID,
    incident_id: MOCK_INCIDENT_ID,
    status,
    user_request: userRequest,
    findings: [],
    root_cause: null,
    impact: null,
    recovery: null,
    verification: null,
  };
}

export function getMockInvestigationEvents(investigationId = MOCK_INVESTIGATION_ID): AgentEvent[] {
  return [
    event("EV-001", "investigation_started", investigationId, {
      message: "Investigation started",
    }),
    event("EV-002", "tool_started", investigationId, {
      tool: "query_database",
      label: "Analyzing sales performance",
    }),
    event("EV-003", "tool_completed", investigationId, {
      tool: "query_database",
      status: "success",
      label: "Sales data loaded",
    }),
    event("EV-004", "tool_started", investigationId, {
      tool: "detect_anomaly",
      label: "Comparing historical baseline",
    }),
    event("EV-005", "tool_completed", investigationId, {
      tool: "detect_anomaly",
      status: "success",
      label: "Sales anomaly detected",
    }),
    event("EV-006", "finding_created", investigationId, {
      finding_id: "F-001",
      type: "ANOMALY",
      title: "Sales dropped 38%",
      description: "Today is at 62,000 against a 100,000 expected baseline.",
      confidence: 0.96,
    }),
    event("EV-007", "tool_started", investigationId, {
      tool: "analyze_logs",
      label: "Checking inventory ETL logs",
    }),
    event("EV-008", "tool_completed", investigationId, {
      tool: "analyze_logs",
      status: "success",
      label: "Duplicate record error found",
    }),
    event("EV-009", "finding_created", investigationId, {
      finding_id: "F-002",
      type: "LOG_EVIDENCE",
      title: "Inventory ETL stopped",
      description: "Process inventory_etl failed at 08:31 with DUPLICATE_RECORD.",
      confidence: 0.94,
    }),
    event("EV-010", "root_cause_found", investigationId, {
      type: "DUPLICATE_RECORDS",
      title: "Duplicate records caused ETL failure",
      description: "Duplicate inventory records stopped the ETL and left sales reports incomplete.",
      confidence: 0.94,
      evidence: ["F-001", "F-002"],
    }),
    event("EV-011", "impact_calculated", investigationId, {
      records_affected: 12453,
      estimated_business_impact: 125000,
      currency: "USD",
      affected_regions: ["ASU", "LAMB", "CDE"],
      affected_period_minutes: 137,
    }),
    event("EV-012", "approval_required", investigationId, {
      approval_id: "APR-001",
      action: "REPROCESS_ETL",
      title: "Reprocess inventory ETL",
      reason: "Restore missing inventory data",
      estimated_records: 12453,
      risk: "LOW",
    }),
  ];
}

export function getMockRecoveryEvents(investigationId = MOCK_INVESTIGATION_ID): AgentEvent[] {
  return [
    event("EV-013", "action_started", investigationId, {
      action_id: "ACT-001",
      action: "REPROCESS_ETL",
      label: "Reprocessing inventory ETL",
    }),
    event("EV-014", "action_completed", investigationId, {
      action_id: "ACT-001",
      status: "SUCCESS",
      records_processed: 12453,
    }),
    event("EV-015", "verification_started", investigationId, {
      action_id: "ACT-001",
      label: "Verifying recovery",
    }),
    event("EV-016", "incident_resolved", investigationId, {
      message: "Incident successfully resolved",
      verification_id: "VER-001",
      verification: MOCK_VERIFICATION,
      report: MOCK_FINAL_REPORT,
    }),
  ];
}

export function getMockRejectedEvent(investigationId = MOCK_INVESTIGATION_ID): AgentEvent {
  return event("EV-013", "investigation_failed", investigationId, {
    error_code: "RECOVERY_REJECTED",
    message: "Recovery was rejected by the user",
  });
}

function event(
  event_id: AgentEvent["event_id"],
  type: AgentEvent["type"],
  investigation_id: AgentEvent["investigation_id"],
  data: AgentEvent["data"],
): AgentEvent {
  return {
    event_id,
    type,
    investigation_id,
    timestamp: "2026-09-12T15:00:00Z",
    data,
  };
}
