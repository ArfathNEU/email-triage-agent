import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface Props {
  /** When true, poll every 1s. When false, stop polling. */
  active: boolean;
}

/**
 * Polls /agent/status every second while `active` is true.
 * Renders a progress bar with completed/total counts and failure count.
 * Hidden when state is "idle" and no run has happened yet.
 */
export function AgentProgressBar({ active }: Props) {
  const query = useQuery({
    queryKey: ["agent-status"],
    queryFn: api.getAgentStatus,
    refetchInterval: active ? 1000 : false,
    enabled: active,
  });

  // When `active` flips from true -> false, do one final fetch to
  // capture the "finished" state for the summary line.
  useEffect(() => {
    if (!active) {
      query.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const data = query.data;
  if (!data || data.state === "idle") return null;

  const pct =
    data.total > 0 ? Math.min(100, (data.completed / data.total) * 100) : 0;

  const isRunning = data.state === "running";

  return (
    <div
      className="mt-3 rounded-md border border-violet-200 bg-violet-50 p-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-violet-900">
          {isRunning ? "Agent processing emails…" : "Agent finished"}
        </span>
        <span className="font-mono text-violet-800">
          {data.completed} / {data.total}
          {data.failed > 0 && (
            <span className="ml-2 text-red-700">({data.failed} failed)</span>
          )}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
        <div
          className="h-full bg-violet-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}