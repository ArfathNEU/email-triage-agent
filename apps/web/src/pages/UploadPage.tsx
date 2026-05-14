import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, ApiError, type UploadResult } from "../lib/api";

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (f: File) => api.uploadCsv(f),
    onSuccess: (data) => setResult(data),
  });

  const agentMutation = useMutation({
    mutationFn: () => api.runAgent(),
  });

  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0];
      if (!f) return;
      setFile(f);
      setResult(null);
      uploadMutation.reset();
      agentMutation.reset();
    },
    [uploadMutation, agentMutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  } as unknown as Parameters<typeof useDropzone>[0]);

  const uploadError = uploadMutation.error;
  const uploadErrorBody =
    uploadError instanceof ApiError &&
    typeof uploadError.body === "object" &&
    uploadError.body !== null
      ? (uploadError.body as { message?: string; error?: string })
      : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Upload emails</h1>
      <p className="mt-2 text-gray-600">
        Drop a CSV of emails and the agent will triage them.
      </p>

      <div
        {...getRootProps()}
        className={`mt-6 cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragActive
            ? "border-gray-900 bg-gray-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <input
          {...(getInputProps() as React.InputHTMLAttributes<HTMLInputElement>)}
        />
        {file ? (
          <p className="text-gray-900">
            <span className="font-medium">{file.name}</span>{" "}
            <span className="text-gray-500">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </p>
        ) : isDragActive ? (
          <p className="text-gray-900">Release to upload…</p>
        ) : (
          <p className="text-gray-600">
            Drop a CSV here, or click to select a file
          </p>
        )}
      </div>

      {file && !uploadMutation.isPending && !result && (
        <button
          type="button"
          onClick={() => uploadMutation.mutate(file)}
          className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Upload {file.name}
        </button>
      )}

      {uploadMutation.isPending && (
        <p className="mt-4 text-gray-600">Uploading and parsing…</p>
      )}

      {uploadError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-900">Upload failed</p>
          <p className="mt-1 text-sm text-red-700">
            {uploadErrorBody?.message ?? (uploadError as Error).message}
          </p>
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Upload complete
          </h2>
          <dl className="mt-2 grid grid-cols-3 gap-4">
            <div>
              <dt className="text-xs text-gray-500">Inserted</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {result.inserted}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Skipped</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {result.skipped}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Total in DB</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {result.totalEmailsInDb}
              </dd>
            </div>
          </dl>

          {result.errors.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600">
                {result.errors.length} row(s) skipped
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => agentMutation.mutate()}
              disabled={agentMutation.isPending}
              className="rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
            >
              {agentMutation.isPending
                ? "Running agent (this may take ~30s)…"
                : "Run agent on inbox"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/inbox")}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Skip to inbox →
            </button>
          </div>

          {agentMutation.data && (
            <div className="mt-4 rounded-md border border-violet-200 bg-violet-50 p-3">
              <p className="text-sm font-medium text-violet-900">
                Agent finished
              </p>
              <p className="mt-1 text-sm text-violet-800">
                Processed {agentMutation.data.processed} emails ·{" "}
                {agentMutation.data.toolCallsTotal} tool calls ·{" "}
                {agentMutation.data.failures.length} failures
              </p>
              <button
                type="button"
                onClick={() => navigate("/inbox")}
                className="mt-3 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
              >
                View triaged inbox →
              </button>
            </div>
          )}

          {agentMutation.error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-900">
                Agent run failed
              </p>
              <p className="mt-1 text-sm text-red-700">
                {(agentMutation.error as Error).message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}