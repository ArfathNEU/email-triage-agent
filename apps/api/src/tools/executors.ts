import { createHash } from "node:crypto";
import type { ToolName } from "@app/shared";

// Deterministic hash → same args produce the same fake IDs every time.
// Required by assignment §4.2: "deterministic given the same input".
function hash(args: Record<string, unknown>, prefix: string): string {
  const h = createHash("sha256")
    .update(JSON.stringify(args, Object.keys(args).sort()))
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `${prefix}-${h}`;
}

type Executor = (args: Record<string, unknown>) => Record<string, unknown>;

const executors: Record<ToolName, Executor> = {
  schedule_meeting: (args) => ({
    meetingId: hash(args, "MTG"),
    status: "scheduled",
    calendarLink: `https://calendar.example.com/events/${hash(args, "evt")}`,
    attendees: args.attendees ?? [],
    proposedTime: args.proposed_time,
    durationMinutes: args.duration_minutes ?? 30,
    subject: args.subject,
  }),

  draft_response: (args) => ({
    draftId: hash(args, "DRAFT"),
    status: "ready_to_send",
    to: args.to,
    subject: args.subject,
    body: args.body,
    tone: args.tone,
    characterCount: String(args.body ?? "").length,
  }),

  escalate_to_manager: (args) => ({
    ticketId: hash(args, "ESC"),
    status: "open",
    priority: args.priority,
    assignedTo: args.suggested_owner ?? "[email protected]",
    reason: args.reason,
    slaHours:
      args.priority === "high" ? 4 : args.priority === "medium" ? 24 : 72,
  }),

  create_task: (args) => ({
    taskId: hash(args, "TASK"),
    status: "todo",
    title: args.title,
    dueDate: args.due_date ?? null,
    assignee: args.assignee ?? "[email protected]",
    notes: args.notes ?? "",
  }),

  flag_urgent: (args) => ({
    flagId: hash(args, "FLAG"),
    status: "flagged",
    reason: args.reason,
    deadline: args.deadline ?? null,
  }),

  archive_no_action: (args) => ({
    archiveId: hash(args, "ARCH"),
    status: "archived",
    category: args.category,
    reason: args.reason ?? "No action required.",
  }),
};

export function executeTool(
  toolName: ToolName,
  args: Record<string, unknown>,
): Record<string, unknown> {
  const fn = executors[toolName];
  if (!fn) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  return fn(args);
}