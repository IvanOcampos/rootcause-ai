export const OFFICIAL_INVESTIGATION_STATUSES = [
  "CREATED",
  "INVESTIGATING",
  "ROOT_CAUSE_FOUND",
  "WAITING_APPROVAL",
  "RECOVERING",
  "VERIFYING",
  "RESOLVED",
  "FAILED",
  "CANCELLED",
] as const;

export const OFFICIAL_AGENT_EVENT_TYPES = [
  "investigation_started",
  "tool_started",
  "tool_completed",
  "finding_created",
  "root_cause_found",
  "impact_calculated",
  "approval_required",
  "action_started",
  "action_completed",
  "verification_started",
  "incident_resolved",
  "investigation_failed",
] as const;

export type InvestigationStatus = (typeof OFFICIAL_INVESTIGATION_STATUSES)[number];

export type AgentEventType = (typeof OFFICIAL_AGENT_EVENT_TYPES)[number];

export type AgentEvent = {
  event_id: string;
  type: AgentEventType;
  investigation_id: string;
  timestamp: string;
  data: Record<string, unknown>;
};

export type Finding = {
  finding_id: string;
  type?: string;
  title: string;
  description: string;
  confidence: number;
};

export type RootCause = {
  type: string;
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
};

export type Impact = {
  records_affected: number;
  estimated_business_impact: number;
  currency: string;
  affected_regions: string[];
  affected_period_minutes?: number;
};

export type RecoveryPlan = {
  approval_id: string;
  action: string;
  title: string;
  reason: string;
  estimated_records: number;
  risk: string;
};

export type Verification = {
  verification_id?: string;
  status?: "PENDING" | "PASSED" | "FAILED";
  verified: boolean;
  checks: {
    sales_recovered: boolean;
    inventory_complete: boolean;
    etl_success: boolean;
  };
  before_value: number;
  after_value: number;
  verification_message?: string;
};

export type FinalReport = {
  title: string;
  executive_summary: string;
  analysis: Array<{
    label: string;
    detail: string;
  }>;
  recommended_prevention: string;
};

export type Investigation = {
  investigation_id: string;
  incident_id: string;
  status: InvestigationStatus;
  user_request: string;
  findings: Finding[];
  root_cause: RootCause | null;
  impact: Impact | null;
  recovery: RecoveryPlan | null;
  verification: Verification | null;
};

export type CreateInvestigationResponse = {
  investigation_id: string;
  incident_id: string;
  status: "CREATED";
};

export type ApprovalDecision = "APPROVED" | "REJECTED";

export type ApprovalResponse = {
  approval_id: string;
  status: ApprovalDecision;
};

export function getEventLabel(agentEvent: AgentEvent) {
  if (typeof agentEvent.data.label === "string") return agentEvent.data.label;
  if (typeof agentEvent.data.title === "string") return agentEvent.data.title;
  if (typeof agentEvent.data.message === "string") return agentEvent.data.message;

  const labels: Record<AgentEventType, string> = {
    investigation_started: "Investigation started",
    tool_started: "Tool started",
    tool_completed: "Tool completed",
    finding_created: "Finding created",
    root_cause_found: "Root cause found",
    impact_calculated: "Impact calculated",
    approval_required: "Approval required",
    action_started: "Action started",
    action_completed: "Action completed",
    verification_started: "Verification started",
    incident_resolved: "Incident resolved",
    investigation_failed: "Investigation failed",
  };

  return labels[agentEvent.type];
}

export function getInvestigationStatusFromEvents(events: AgentEvent[]): InvestigationStatus {
  const latest = events.at(-1);

  if (!latest) return "CREATED";
  if (latest.type === "investigation_failed") return "FAILED";
  if (latest.type === "incident_resolved") return "RESOLVED";
  if (latest.type === "verification_started") return "VERIFYING";
  if (latest.type === "action_started" || latest.type === "action_completed") return "RECOVERING";
  if (latest.type === "approval_required") return "WAITING_APPROVAL";
  if (latest.type === "root_cause_found" || latest.type === "impact_calculated") {
    return "ROOT_CAUSE_FOUND";
  }

  return "INVESTIGATING";
}

export function isOfficialAgentEventType(type: string): type is AgentEventType {
  return OFFICIAL_AGENT_EVENT_TYPES.some((eventType) => eventType === type);
}

export function normalizeAgentEvent(payload: unknown, fallbackType?: string): AgentEvent {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid agent event payload");
  }

  const eventPayload = payload as Partial<AgentEvent>;
  const type = typeof eventPayload.type === "string" ? eventPayload.type : fallbackType;

  if (!type || !isOfficialAgentEventType(type)) {
    throw new Error("Unknown agent event type");
  }

  if (
    typeof eventPayload.event_id !== "string" ||
    typeof eventPayload.investigation_id !== "string" ||
    typeof eventPayload.timestamp !== "string"
  ) {
    throw new Error("Incomplete agent event payload");
  }

  return {
    event_id: eventPayload.event_id,
    type,
    investigation_id: eventPayload.investigation_id,
    timestamp: eventPayload.timestamp,
    data:
      eventPayload.data && typeof eventPayload.data === "object"
        ? (eventPayload.data as Record<string, unknown>)
        : {},
  };
}
