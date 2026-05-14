import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Email } from "@app/shared";

export default function InboxPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["emails"],
    queryFn: api.listEmails,
  });

  const detailQuery = useQuery({
    queryKey: ["emails", selectedId],
    queryFn: () => api.getEmail(selectedId!),
    enabled: selectedId !== null,
  });

  const filtered = useMemo(() => {
    const emails = listQuery.data?.emails ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return emails;
    return emails.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q),
    );
  }, [listQuery.data, search]);

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

  return (
    <div className="flex h-[calc(100vh-60px)]">
      <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Inbox{" "}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {filtered.length} of {emails.length}
            </span>
          </h1>
          <input
            type="text"
            placeholder="Search sender or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
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

      <div className="flex-1 overflow-y-auto bg-white">
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
          <EmailDetail email={detailQuery.data} />
        ) : null}
      </div>
    </div>
  );
}

function EmailRow({
  email,
  isSelected,
  onClick,
}: {
  email: Email;
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
      </button>
    </li>
  );
}

function EmailDetail({
  email,
}: {
  email: Email & { toolCalls: unknown[] };
}) {
  return (
    <article className="p-6">
      <header className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {email.subject || "(no subject)"}
        </h2>
        <dl className="mt-2 text-sm text-gray-600 space-y-0.5">
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-12">From</dt>
            <dd className="font-mono">{email.from}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-12">To</dt>
            <dd className="font-mono">{email.to}</dd>
          </div>
          {email.cc && (
            <div className="flex gap-2">
              <dt className="font-medium text-gray-500 w-12">Cc</dt>
              <dd className="font-mono">{email.cc}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-12">Date</dt>
            <dd className="font-mono">{email.date}</dd>
          </div>
        </dl>
      </header>

      <pre className="mt-6 whitespace-pre-wrap font-sans text-sm text-gray-800">
        {email.body}
      </pre>

      <section className="mt-8">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Agent recommendations
        </h3>
        {email.toolCalls.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No tool calls yet. Run the agent (coming in next step).
          </p>
        ) : (
          <pre className="mt-2 text-xs">
            {JSON.stringify(email.toolCalls, null, 2)}
          </pre>
        )}
      </section>
    </article>
  );
}