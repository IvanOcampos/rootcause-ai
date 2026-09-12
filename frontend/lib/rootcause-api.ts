import {
  OFFICIAL_AGENT_EVENT_TYPES,
  normalizeAgentEvent,
  type AgentEvent,
  type ApprovalDecision,
  type ApprovalResponse,
  type CreateInvestigationResponse,
  type Investigation,
} from "./contracts";
import {
  createMockInvestigation,
  getMockInvestigation,
  getMockInvestigationEvents,
  getMockRecoveryEvents,
} from "./mock-investigation";

export type EventStreamPhase = "investigation" | "recovery";

export type RootCauseApiConfig = {
  apiUrl: string;
  useMocks: boolean;
};

export type EventStreamHandlers = {
  onEvent: (event: AgentEvent) => void;
  onError: (error: Error) => void;
  onDone?: () => void;
};

export type RootCauseApiClient = {
  config: RootCauseApiConfig;
  createInvestigation: (userRequest: string) => Promise<CreateInvestigationResponse>;
  getInvestigation: (investigationId: string) => Promise<Investigation>;
  submitApproval: (
    investigationId: string,
    approvalId: string,
    decision: ApprovalDecision,
  ) => Promise<ApprovalResponse>;
  subscribeInvestigationEvents: (
    investigationId: string,
    handlers: EventStreamHandlers,
    phase?: EventStreamPhase,
  ) => () => void;
};

export class RootCauseApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "RootCauseApiError";
  }
}

export function getRootCauseApiConfig(): RootCauseApiConfig {
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
    useMocks: process.env.NEXT_PUBLIC_USE_MOCKS !== "false",
  };
}

export function createRootCauseApiClient(config = getRootCauseApiConfig()): RootCauseApiClient {
  if (config.useMocks) {
    return createMockClient(config);
  }

  return createLiveClient(config);
}

function createMockClient(config: RootCauseApiConfig): RootCauseApiClient {
  let lastUserRequest = "";

  return {
    config,
    async createInvestigation(userRequest) {
      lastUserRequest = userRequest;
      await sleep(220);
      return createMockInvestigation();
    },
    async getInvestigation(investigationId) {
      await sleep(120);
      return {
        ...getMockInvestigation(lastUserRequest),
        investigation_id: investigationId,
      };
    },
    async submitApproval(_investigationId, approvalId, decision) {
      await sleep(180);
      return {
        approval_id: approvalId,
        status: decision,
      };
    },
    subscribeInvestigationEvents(investigationId, handlers, phase = "investigation") {
      const events =
        phase === "recovery"
          ? getMockRecoveryEvents(investigationId)
          : getMockInvestigationEvents(investigationId);

      return streamMockEvents(events, handlers);
    },
  };
}

function createLiveClient(config: RootCauseApiConfig): RootCauseApiClient {
  return {
    config,
    createInvestigation(userRequest) {
      return requestJson<CreateInvestigationResponse>(config, "/api/investigations", {
        method: "POST",
        body: JSON.stringify({ user_request: userRequest }),
      });
    },
    getInvestigation(investigationId) {
      return requestJson<Investigation>(config, `/api/investigations/${investigationId}`);
    },
    submitApproval(investigationId, approvalId, decision) {
      return requestJson<ApprovalResponse>(
        config,
        `/api/investigations/${investigationId}/approvals/${approvalId}`,
        {
          method: "POST",
          body: JSON.stringify({ decision }),
        },
      );
    },
    subscribeInvestigationEvents(investigationId, handlers) {
      const source = new EventSource(
        `${config.apiUrl}/api/investigations/${investigationId}/events`,
      );

      const handlePayload = (messageEvent: MessageEvent, fallbackType?: string) => {
        try {
          const event = normalizeAgentEvent(JSON.parse(messageEvent.data), fallbackType);
          handlers.onEvent(event);
          if (
            event.type === "approval_required" ||
            event.type === "incident_resolved" ||
            event.type === "investigation_failed"
          ) {
            handlers.onDone?.();
            source.close();
          }
        } catch (error) {
          handlers.onError(toError(error));
        }
      };

      source.onmessage = (messageEvent) => handlePayload(messageEvent);
      source.onerror = () => {
        handlers.onError(new RootCauseApiError("SSE connection failed"));
        source.close();
      };

      OFFICIAL_AGENT_EVENT_TYPES.forEach((eventType) => {
        source.addEventListener(eventType, (messageEvent) => {
          handlePayload(messageEvent, eventType);
        });
      });

      return () => source.close();
    },
  };
}

async function requestJson<T>(
  config: RootCauseApiConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new RootCauseApiError(`Request failed: ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

function streamMockEvents(events: AgentEvent[], handlers: EventStreamHandlers) {
  let index = 0;
  let cancelled = false;
  let timeoutId: number | undefined;

  const emitNext = () => {
    if (cancelled) return;

    const nextEvent = events[index];
    if (!nextEvent) {
      handlers.onDone?.();
      return;
    }

    handlers.onEvent(nextEvent);
    index += 1;
    timeoutId = window.setTimeout(emitNext, index === 1 ? 250 : 850);
  };

  timeoutId = window.setTimeout(emitNext, 180);

  return () => {
    cancelled = true;
    if (timeoutId) window.clearTimeout(timeoutId);
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error("Unknown frontend integration error");
}
