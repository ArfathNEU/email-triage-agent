import type {
  HealthResponse,
  Email,
  EmailWithToolCalls,
} from "@app/shared";

const BASE_URL = "/api";

class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(res.status, `${res.status} ${res.statusText}`, body);
  }

  return (await res.json()) as T;
}

async function upload<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(res.status, `${res.status} ${res.statusText}`, body);
  }

  return (await res.json()) as T;
}

export interface UploadResult {
  inserted: number;
  skipped: number;
  totalEmailsInDb: number;
  errors: { row: number; reason: string }[];
}

export interface AgentProgress {
  state: "idle" | "running" | "finished" | "error";
  total: number;
  completed: number;
  failed: number;
  startedAt: string | null;
  finishedAt: string | null;
  lastError: string | null;
}

export const api = {
  health: () => request<HealthResponse>("/health"),
  uploadCsv: (file: File) => upload<UploadResult>("/uploads", file),
  listEmails: () => request<{ emails: Email[] }>("/emails"),
  getEmail: (id: string) => request<EmailWithToolCalls>(`/emails/${id}`),
  executeTool: (toolCallId: number) =>
    request<{ result: Record<string, unknown>; cached: boolean }>(
      `/tools/${toolCallId}/execute`,
      { method: "POST" },
    ),
  runAgent: () =>
    request<{
      processed: number;
      toolCallsTotal: number;
      failures: { emailId: string; error: string }[];
    }>("/agent/run", { method: "POST" }),
  getAgentStatus: () => request<AgentProgress>("/agent/status"),
};

export { ApiError };