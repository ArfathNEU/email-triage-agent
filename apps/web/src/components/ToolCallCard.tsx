import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ToolCall, ToolName } from "@app/shared";

type ToolMeta = {
  label: string;
  color: string;
  icon: string;
};

const TOOL_META: Record<ToolName, ToolMeta> = {
  schedule_meeting: {
    label: "Schedule meeting",
    color: "bg-blue-50 text-blue-800 border-blue-200",
    icon: "📅",
  },
  draft_response: {
    label: "Draft reply",
    color: "bg-violet-50 text-violet-800 border-violet-200",
    icon: "✉️",
  },
  escalate_to_manager: {
    label: "Escalate",
    color: "bg-red-50 text-red-800 border-red-200",
    icon: "⚠️",
  },
  create_task: {
    label: "Create task",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    icon: "✓",
  },
  flag_urgent: {
    label: "Flag urgent",
    color: "bg-orange-50 text-orange-800 border-orange-200",
    icon: "⏰",
  },
  archive_no_action: {
    label: "Archive",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: "📂",
  },
};

export function ToolBadge({ tool }: { tool: ToolName }) {
  const meta = TOOL_META[tool];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.color}`}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.executeTool(toolCall.id),
    onSuccess: (data) => setResult(data.result),
  });

  const meta = TOOL_META[toolCall.tool];

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <h4 className="text-sm font-semibold text-gray-900">{meta.label}</h4>
        </div>
        {!result && (
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {mutation.isPending ? "Running…" : "Execute"}
          </button>
        )}
      </header>

      <blockquote className="mt-2 border-l-2 border-gray-300 pl-3 text-sm italic text-gray-600">
        {toolCall.rationale}
      </blockquote>

      <dl className="mt-3 space-y-1 text-xs">
        {Object.entries(toolCall.arguments).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-32 shrink-0 font-medium text-gray-500">{k}</dt>
            <dd className="break-all text-gray-800">
              {typeof v === "string" ? v : JSON.stringify(v)}
            </dd>
          </div>
        ))}
      </dl>

      {mutation.isError && (
        <p className="mt-3 text-xs text-red-700">
          Failed: {(mutation.error as Error).message}
        </p>
      )}

      {result && <ToolResult tool={toolCall.tool} result={result} />}
    </article>
  );
}

function ToolResult({
  tool,
  result,
}: {
  tool: ToolName;
  result: Record<string, unknown>;
}) {
  const r = result as Record<string, string | number | string[] | null>;

  if (tool === "schedule_meeting") {
    return (
      <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-blue-900">
            {r.meetingId}
          </span>
          <span className="rounded-full bg-blue-200 px-2 text-xs text-blue-900">
            {r.status}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-gray-900">{r.subject}</p>
        <p className="text-xs text-gray-600">
          {r.proposedTime} · {r.durationMinutes} min
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Attendees:{" "}
          <span className="font-mono">
            {Array.isArray(r.attendees) ? r.attendees.join(", ") : ""}
          </span>
        </p>
      </div>
    );
  }

  if (tool === "draft_response") {
    return (
      <div className="mt-4 rounded-md border border-violet-200 bg-violet-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-violet-900">
            {r.draftId}
          </span>
          <span className="rounded-full bg-violet-200 px-2 text-xs text-violet-900">
            {r.status}
          </span>
        </div>
        <p className="text-xs text-gray-600">
          <span className="font-medium">To:</span> {r.to}
        </p>
        <p className="text-xs text-gray-600">
          <span className="font-medium">Subject:</span> {r.subject}
        </p>
        <pre className="mt-2 whitespace-pre-wrap rounded bg-white p-2 text-xs text-gray-800">
          {r.body}
        </pre>
        <p className="mt-1 text-xs text-gray-500">
          {r.characterCount} chars · tone: {r.tone}
        </p>
      </div>
    );
  }

  if (tool === "escalate_to_manager") {
    return (
      <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-red-900">
            {r.ticketId}
          </span>
          <span className="rounded-full bg-red-200 px-2 text-xs uppercase text-red-900">
            {r.priority} · {r.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-800">{r.reason}</p>
        <p className="mt-1 text-xs text-gray-600">
          Assigned to <span className="font-mono">{r.assignedTo}</span> · SLA{" "}
          {r.slaHours}h
        </p>
      </div>
    );
  }

  if (tool === "create_task") {
    return (
      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-amber-900">
            {r.taskId}
          </span>
          <span className="rounded-full bg-amber-200 px-2 text-xs text-amber-900">
            {r.status}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-gray-900">{r.title}</p>
        <p className="text-xs text-gray-600">
          Due: <span className="font-mono">{r.dueDate ?? "—"}</span> · Assignee:{" "}
          <span className="font-mono">{r.assignee}</span>
        </p>
        {r.notes && <p className="mt-1 text-xs text-gray-700">{r.notes}</p>}
      </div>
    );
  }

  if (tool === "flag_urgent") {
    return (
      <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-orange-900">
            {r.flagId}
          </span>
          <span className="rounded-full bg-orange-200 px-2 text-xs text-orange-900">
            {r.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-800">{r.reason}</p>
        {r.deadline && (
          <p className="mt-1 text-xs text-gray-600">Deadline: {r.deadline}</p>
        )}
      </div>
    );
  }

  if (tool === "archive_no_action") {
    return (
      <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-gray-700">
            {r.archiveId}
          </span>
          <span className="rounded-full bg-gray-200 px-2 text-xs text-gray-700">
            {r.status} · {r.category}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-600">{r.reason}</p>
      </div>
    );
  }

  return null;
}