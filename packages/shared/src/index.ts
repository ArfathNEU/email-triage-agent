// ---------- Emails ----------

export interface Email {
  id: string;
  from: string;
  to: string;
  cc: string;
  subject: string;
  date: string; // ISO 8601
  body: string;
}

// ---------- Tools the agent can call ----------

export type ToolName =
  | "schedule_meeting"
  | "draft_response"
  | "escalate_to_manager"
  | "create_task"
  | "flag_urgent"
  | "archive_no_action";

export interface ToolCall {
  id: number;
  emailId: string;
  tool: ToolName;
  arguments: Record<string, unknown>;
  rationale: string;
  createdAt: string;
}

export interface ToolExecution {
  id: number;
  toolCallId: number;
  result: Record<string, unknown>;
  executedAt: string;
}

// ---------- API responses ----------

export interface EmailWithToolCalls extends Email {
  toolCalls: ToolCall[];
}

export interface UploadSummary {
  uploadId: string;
  emailsProcessed: number;
  toolCallsSuggested: number;
  failures: number;
}

export interface HealthResponse {
  status: "ok";
  uptime: number;
  timestamp: string;
}