import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Email, ToolCall, ToolName } from "@app/shared";
import { ToolCallCard, ToolBadge } from "../components/ToolCallCard";

const ALL_TOOLS: ToolName[] = [
  "schedule_meeting",
  "draft_response",
  "escalate_to_manager",
  "create_task",
  "flag_urgent",
  "archive_no_action",
];

interface EmailWithBadges extends Email {
  tools: ToolName[];
}

export default function InboxPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toolFilter, setToolFilter] = useState<ToolName | null>(null);

  const listQuery = useQuery({
    queryKey: ["emails"],
    queryFn: api.listEmails,
  });

  const detailsQuery = useQuery({
    queryKey: ["all-email-details"],
    queryFn: async () => {
      const list = await api.listEmails();
      const all = await Promise.all(
        list.emails.map((e) => api.getEmail(e.id)),
      );
      return all;
    },
    enabled: !listQuery.isLoading && listQuery.data !== undefined,
  });

  const detailMap = useMemo(() => {
    const m = new Map<string, ToolName[]>();
    if (detailsQuery.data) {
      for (const d of detailsQuery.data) {
        m.set(
          d.id,
          d.toolCalls.map((tc) => tc.tool as ToolName),
        );
      }
    }
    return m;
  }, [detailsQuery.data]);

  const detailQuery = useQuery({
    queryKey: ["emails", selectedId],
    queryFn: () => api.getEmail(selectedId!),
    enabled: selectedId !== null,
  });

  const filtered: EmailWithBadges[] = useMemo(() => {
    const emails = listQuery.data?.emails ?? [];
    const q = search.trim().toLowerCase();
    return emails
      .map((e) => ({ ...e, tools: detailMap.get(e.id) ?? [] }))
      .filter((e) => {
        if (q) {
          const haystack = `${e.subject} ${e.from}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        if (toolFilter && !e.tools.includes(toolFilter)) return false;
        return true;
      });
  }, [listQuery.data, detailMap, search, toolFilter]);

  if (listQuery.isLoading) {
    return <div className="p-8 text-gray-600">Loading inbox…</div>;
  }

  if (listQuery.isError) {
    return (
      <div className="p-8 text-red-700">
        Failed to load inbox: {(listQuery.error as Error).message}
      </div>
    );
  }

  const emails = listQuery.data?.emails ?? [];

  if (emails.length === 0) {
    return (
      <div className="p-8">
        <p className="text-gray-600">
          Inbox is empty. Go to{" "}
          <a className="text-blue-600 underline" href="/upload">
            Upload
          </a>{" "}
          to add a CSV.
        </p>
      </div>
    );
  }

  const showList = selectedId === null;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-60px)]">
      <div
        className={`${showList ? "" : "hidden md:block"} w-full md:w-1/2 border-r border-gray-200 overflow-y-auto`}
      >
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Inbox{" "}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {filtered.length} of {emails.length}
              </span>
            </h1>
            <RunAgentButton />
          </div>
          <input
            type="text"
            placeholder="Search sender or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search emails by sender or subject"
            className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <FilterChip
              label="All"
              active={toolFilter === null}
              onClick={() => setToolFilter(null)}
            />
            {ALL_TOOLS.map((t) => (
              <FilterChip
                key={t}
                label={t.replace(/_/g, " ")}
                active={toolFilter === t}
                onClick={() => setToolFilter(toolFilter === t ? null : t)}
              />
            ))}
          </div>
        </div>

        <ul>
          {filtered.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              isSelected={email.id === selectedId}
              onClick={() => setSelectedId(email.id)}
            />
          ))}
        </ul>
      </div>

      <div
        className={`${showList ? "hidden md:flex" : "flex"} flex-1 flex-col overflow-y-auto bg-white`}
      >
        {selectedId === null ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            Select an email to view details
          </div>
        ) : detailQuery.isLoading ? (
          <div className="p-8 text-gray-600">Loading email…</div>
        ) : detailQuery.isError ? (
          <div className="p-8 text-red-700">
            Failed: {(detailQuery.error as Error).message}
          </div>
        ) : detailQuery.data ? (
          <EmailDetail
            email={detailQuery.data}
            onBack={() => setSelectedId(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

function RunAgentButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.runAgent(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["all-email-details"] });
    },
  });

  return (
    <div className="flex items-center gap-2">
      {mutation.data && (
        <span className="hidden sm:inline text-xs text-gray-600">
          {mutation.data.processed} processed ·{" "}
          {mutation.data.toolCallsTotal} calls ·{" "}
          {mutation.data.failures.length} failed
        </span>
      )}
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        aria-label="Run the agent on all uploaded emails"
        className="rounded-md bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-800 disabled:opacity-50"
      >
        {mutation.isPending ? "Running…" : "Run agent"}
      </button>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function EmailRow({
  email,
  isSelected,
  onClick,
}: {
  email: EmailWithBadges;
  isSelected: boolean;
  onClick: () => void;
}) {
  const date = new Date(email.date);
  const dateLabel = isNaN(date.getTime())
    ? email.date.slice(0, 10)
    : date.toLocaleDateString();

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full border-b border-gray-100 p-4 text-left transition-colors ${
          isSelected ? "bg-gray-100" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-gray-900">
            {email.from}
          </p>
          <span className="ml-2 shrink-0 text-xs text-gray-500">
            {dateLabel}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-gray-700">
          {email.subject || "(no subject)"}
        </p>
        {email.tools.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {email.tools.map((t, i) => (
              <ToolBadge key={i} tool={t} />
            ))}
          </div>
        )}
      </button>
    </li>
  );
}

function EmailDetail({
  email,
  onBack,
}: {
  email: Email & { toolCalls: ToolCall[] };
  onBack: () => void;
}) {
  return (
    <article className="p-6">
      <header className="border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to inbox list"
          className="md:hidden mb-3 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to inbox
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {email.subject || "(no subject)"}
        </h2>
        <dl className="mt-2 space-y-0.5 text-sm text-gray-600">
          <div className="flex gap-2">
            <dt className="w-12 font-medium text-gray-500">From</dt>
            <dd className="font-mono break-all">{email.from}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-12 font-medium text-gray-500">To</dt>
            <dd className="font-mono break-all">{email.to}</dd>
          </div>
          {email.cc && (
            <div className="flex gap-2">
              <dt className="w-12 font-medium text-gray-500">Cc</dt>
              <dd className="font-mono break-all">{email.cc}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="w-12 font-medium text-gray-500">Date</dt>
            <dd className="font-mono">{email.date}</dd>
          </div>
        </dl>
      </header>

      <pre className="mt-6 whitespace-pre-wrap font-sans text-sm text-gray-800">
        {email.body}
      </pre>

      <section className="mt-8">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Agent recommendations ({email.toolCalls.length})
        </h3>
        {email.toolCalls.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No tool calls yet. Run the agent.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {email.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}