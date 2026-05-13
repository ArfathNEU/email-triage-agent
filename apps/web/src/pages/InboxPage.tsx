import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function InboxPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Backend status
        </h2>

        {isLoading && <p className="mt-2 text-gray-600">Checking…</p>}

        {isError && (
          <p className="mt-2 text-red-600">
            Cannot reach API: {(error as Error).message}
          </p>
        )}

        {data && (
          <div className="mt-2 space-y-1 text-sm">
            <p>
              <span className="text-gray-500">Status:</span>{" "}
              <span className="font-medium text-green-700">{data.status}</span>
            </p>
            <p>
              <span className="text-gray-500">Uptime:</span>{" "}
              <span className="font-mono">{data.uptime.toFixed(1)}s</span>
            </p>
            <p>
              <span className="text-gray-500">Server time:</span>{" "}
              <span className="font-mono">{data.timestamp}</span>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}