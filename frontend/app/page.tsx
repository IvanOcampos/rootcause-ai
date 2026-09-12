"use client";

import { useMemo, useRef, useState } from "react";
import {
  getEventLabel,
  getInvestigationStatusFromEvents,
  type AgentEvent,
  type Finding,
  type Impact,
  type RecoveryPlan,
  type RootCause,
  type Verification,
} from "../lib/contracts";
import { DEFAULT_DEMO_REQUEST, getMockRejectedEvent, MOCK_VERIFICATION } from "../lib/mock-investigation";
import { createRootCauseApiClient, type EventStreamPhase } from "../lib/rootcause-api";

const client = createRootCauseApiClient();

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected frontend error";
}

export default function Home() {
  const [request, setRequest] = useState(DEFAULT_DEMO_REQUEST);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [decision, setDecision] = useState<"idle" | "approved" | "rejected">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stopStreamRef = useRef<null | (() => void)>(null);

  const status = getInvestigationStatusFromEvents(events);

  const findings = useMemo(() => {
    return events
      .filter((agentEvent) => agentEvent.type === "finding_created")
      .map((agentEvent) => agentEvent.data as Finding);
  }, [events]);

  const rootCause = useMemo(() => {
    return events.find((agentEvent) => agentEvent.type === "root_cause_found")?.data as
      | RootCause
      | undefined;
  }, [events]);

  const impact = useMemo(() => {
    return events.find((agentEvent) => agentEvent.type === "impact_calculated")?.data as
      | Impact
      | undefined;
  }, [events]);

  const recovery = useMemo(() => {
    return events.find((agentEvent) => agentEvent.type === "approval_required")?.data as
      | RecoveryPlan
      | undefined;
  }, [events]);

  const verification = useMemo<Verification | undefined>(() => {
    if (status !== "RESOLVED") return undefined;

    const resolvedEvent = events.find((agentEvent) => agentEvent.type === "incident_resolved");
    const eventVerification = resolvedEvent?.data.verification;

    if (eventVerification && typeof eventVerification === "object") {
      return eventVerification as Verification;
    }

    return MOCK_VERIFICATION;
  }, [events, status]);

  const canApprove = status === "WAITING_APPROVAL" && decision === "idle" && !isBusy;

  function appendEvent(agentEvent: AgentEvent) {
    setEvents((current) => {
      if (current.some((event) => event.event_id === agentEvent.event_id)) return current;
      return [...current, agentEvent];
    });
  }

  function stopActiveStream() {
    stopStreamRef.current?.();
    stopStreamRef.current = null;
  }

  function subscribeToEvents(id: string, phase: EventStreamPhase = "investigation") {
    stopActiveStream();
    setIsBusy(true);

    stopStreamRef.current = client.subscribeInvestigationEvents(
      id,
      {
        onEvent: appendEvent,
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
          setIsBusy(false);
        },
        onDone: () => setIsBusy(false),
      },
      phase,
    );
  }

  async function startInvestigation() {
    stopActiveStream();
    setEvents([]);
    setDecision("idle");
    setErrorMessage(null);
    setInvestigationId(null);
    setIncidentId(null);
    setIsBusy(true);

    try {
      const investigation = await client.createInvestigation(request);
      setInvestigationId(investigation.investigation_id);
      setIncidentId(investigation.incident_id);
      subscribeToEvents(investigation.investigation_id);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsBusy(false);
    }
  }

  async function approveRecovery() {
    if (!investigationId || !recovery) return;

    setDecision("approved");
    setErrorMessage(null);
    setIsBusy(true);

    try {
      await client.submitApproval(investigationId, recovery.approval_id, "APPROVED");
      if (client.config.useMocks) {
        subscribeToEvents(investigationId, "recovery");
      }
    } catch (error) {
      setDecision("idle");
      setErrorMessage(getErrorMessage(error));
      setIsBusy(false);
    }
  }

  async function rejectRecovery() {
    if (!investigationId || !recovery) return;

    setDecision("rejected");
    setErrorMessage(null);
    setIsBusy(true);

    try {
      await client.submitApproval(investigationId, recovery.approval_id, "REJECTED");
      if (client.config.useMocks) {
        appendEvent(getMockRejectedEvent(investigationId));
      }
    } catch (error) {
      setDecision("idle");
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="status-rail" aria-label="System status">
        <div className="brand-block">
          <div className="brand-mark">RC</div>
          <div>
            <p className="eyebrow">RootCause AI</p>
            <h1>Incident Command</h1>
          </div>
        </div>

        <div className="incident-score">
          <span className={`score-orb ${status === "RESOLVED" ? "good" : "hot"}`} />
          <div>
            <p>Sales Performance</p>
            <strong>{status === "RESOLVED" ? "99.4%" : "62.0%"}</strong>
            <span>{status === "RESOLVED" ? "Recovered" : "38% below normal"}</span>
          </div>
        </div>

        <SystemList resolved={status === "RESOLVED"} />
      </aside>

      <section className="workbench" aria-label="Investigation workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{investigationId ?? "Investigation not started"}</p>
            <h2>{status.replaceAll("_", " ")}</h2>
          </div>
          <div className="topbar-actions">
            <span className="mode-pill">{client.config.useMocks ? "MOCK" : "LIVE"}</span>
            <span className={`status-pill ${status.toLowerCase()}`}>{status}</span>
          </div>
        </header>

        {errorMessage ? (
          <div className="error-banner" role="alert">
            <strong>Integration error</strong>
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className="layout-grid">
          <section className="command-panel" aria-label="Command center">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Command Center</p>
                <h3>User request</h3>
              </div>
              <span>{client.config.apiUrl}</span>
            </div>

            <textarea
              aria-label="Investigation request"
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              disabled={isBusy}
            />

            <button className="primary-action" onClick={startInvestigation} disabled={isBusy}>
              {events.length > 0 ? "Replay Investigation" : "Start Investigation"}
            </button>

            <div className="contract-strip">
              <span>POST /api/investigations</span>
              <span>GET /events</span>
              <span>POST /approvals</span>
            </div>
          </section>

          <section className="activity-panel" aria-label="Agent activity">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Agent Activity</p>
                <h3>Live trace</h3>
              </div>
              <span>{events.length} events</span>
            </div>

            <div className="timeline" aria-live="polite">
              {events.length === 0 ? (
                <EmptyState />
              ) : (
                events.map((agentEvent) => (
                  <TimelineRow key={agentEvent.event_id} agentEvent={agentEvent} />
                ))
              )}
            </div>
          </section>

          <section className="evidence-panel" aria-label="Findings">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Evidence</p>
                <h3>Findings</h3>
              </div>
              <span>{findings.length}/2</span>
            </div>

            <div className="finding-list">
              {findings.length === 0 ? (
                <p className="muted">No findings yet.</p>
              ) : (
                findings.map((finding) => (
                  <article className="finding-item" key={finding.finding_id}>
                    <div>
                      <span>{finding.finding_id}</span>
                      <strong>{finding.title}</strong>
                      <p>{finding.description}</p>
                    </div>
                    <b>{Math.round(finding.confidence * 100)}%</b>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="root-panel" aria-label="Root cause">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Root Cause</p>
                <h3>{rootCause ? "Cause found" : "Pending"}</h3>
              </div>
              {rootCause ? <span>{Math.round(rootCause.confidence * 100)}%</span> : null}
            </div>

            {rootCause ? (
              <div className="root-cause-body">
                <strong>{rootCause.title}</strong>
                <p>{rootCause.description}</p>
                <div className="evidence-tags">
                  {rootCause.evidence.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="muted">Waiting for correlated evidence.</p>
            )}
          </section>

          <section className="impact-panel" aria-label="Impact">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Impact</p>
                <h3>Business effect</h3>
              </div>
              {incidentId ? <span>{incidentId}</span> : null}
            </div>

            <MetricGrid impact={impact} />
          </section>

          <section className="recovery-panel" aria-label="Recovery plan">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Human Approval</p>
                <h3>Recovery plan</h3>
              </div>
            </div>

            {recovery ? (
              <div className="recovery-body">
                <div className="recovery-summary">
                  <strong>{recovery.title}</strong>
                  <p>{recovery.reason}</p>
                </div>
                <dl>
                  <div>
                    <dt>Action</dt>
                    <dd>{recovery.action}</dd>
                  </div>
                  <div>
                    <dt>Records</dt>
                    <dd>{formatNumber(recovery.estimated_records)}</dd>
                  </div>
                  <div>
                    <dt>Risk</dt>
                    <dd>{recovery.risk}</dd>
                  </div>
                </dl>
                <div className="approval-actions">
                  <button className="primary-action" onClick={approveRecovery} disabled={!canApprove}>
                    Approve
                  </button>
                  <button className="ghost-action" onClick={rejectRecovery} disabled={!canApprove}>
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <p className="muted">The agent will request approval before recovery.</p>
            )}
          </section>

          <section className="verification-panel" aria-label="Verification">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Verification</p>
                <h3>{verification?.verified ? "Verified" : "Waiting"}</h3>
              </div>
            </div>

            <VerificationView verification={verification} />
          </section>
        </div>
      </section>
    </main>
  );
}

function SystemList({ resolved }: { resolved: boolean }) {
  const systems = [
    { label: "Sales", state: resolved ? "healthy" : "critical", value: resolved ? "Healthy" : "Anomaly" },
    { label: "Inventory", state: resolved ? "healthy" : "warning", value: resolved ? "Complete" : "Stale" },
    { label: "ETL", state: resolved ? "healthy" : "critical", value: resolved ? "Recovered" : "Failed" },
    { label: "Reports", state: resolved ? "healthy" : "warning", value: resolved ? "Synced" : "Delayed" },
  ];

  return (
    <div className="system-list">
      {systems.map((system) => (
        <div className="system-row" key={system.label}>
          <span className={`system-dot ${system.state}`} />
          <span>{system.label}</span>
          <strong>{system.value}</strong>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <span className="empty-pulse" />
      <p>Ready to receive the incident request.</p>
    </div>
  );
}

function TimelineRow({ agentEvent }: { agentEvent: AgentEvent }) {
  const isRunning =
    agentEvent.type === "tool_started" ||
    agentEvent.type === "action_started" ||
    agentEvent.type === "verification_started";
  const isWarning = agentEvent.type === "approval_required";
  const isResolved = agentEvent.type === "incident_resolved";
  const isError = agentEvent.type === "investigation_failed";

  return (
    <article
      className={`timeline-row ${isRunning ? "running" : ""} ${isWarning ? "warning" : ""} ${
        isResolved ? "resolved" : ""
      } ${isError ? "failed" : ""}`}
    >
      <span className="timeline-icon" />
      <div>
        <strong>{getEventLabel(agentEvent)}</strong>
        <p>{agentEvent.type}</p>
      </div>
    </article>
  );
}

function MetricGrid({ impact }: { impact?: Impact }) {
  return (
    <div className="metric-grid">
      <div>
        <span>Records</span>
        <strong>{impact ? formatNumber(impact.records_affected) : "--"}</strong>
      </div>
      <div>
        <span>Estimated</span>
        <strong>
          {impact ? formatCurrency(impact.estimated_business_impact, impact.currency) : "--"}
        </strong>
      </div>
      <div>
        <span>Regions</span>
        <strong>{impact ? impact.affected_regions.join(", ") : "--"}</strong>
      </div>
    </div>
  );
}

function VerificationView({ verification }: { verification?: Verification }) {
  if (!verification) {
    return <p className="muted">Resolution can only appear after verification passes.</p>;
  }

  return (
    <div className="verification-body">
      <div className="check-list">
        <span className={verification.checks.sales_recovered ? "passed" : "failed"}>
          Sales recovered
        </span>
        <span className={verification.checks.inventory_complete ? "passed" : "failed"}>
          Inventory complete
        </span>
        <span className={verification.checks.etl_success ? "passed" : "failed"}>ETL successful</span>
      </div>
      <div className="before-after">
        <div>
          <span>Before</span>
          <strong>{formatNumber(verification.before_value)}</strong>
        </div>
        <div>
          <span>After</span>
          <strong>{formatNumber(verification.after_value)}</strong>
        </div>
      </div>
    </div>
  );
}
