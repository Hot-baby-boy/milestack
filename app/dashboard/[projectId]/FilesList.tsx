"use client";

import { useState } from "react";
import { getDownloadUrl } from "@/lib/files/actions";

type FileRow = { id: string; name: string; size: number; mime: string; created_at: string };

export function FilesList({ files }: { files: FileRow[] }) {
  const [error, setError] = useState<string | null>(null);

  async function onDownload(fileId: string) {
    setError(null);
    const result = await getDownloadUrl(fileId);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    window.open(result.url, "_blank");
  }

  if (!files.length) {
    return <p className="mt-2 text-sm text-slate-500">No files yet. Attach one from the chat below.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {files.map((f) => (
        <div
          key={f.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        >
          <div>
            <p className="text-sm font-medium text-slate-900">{f.name}</p>
            <p className="text-xs text-slate-400">
              {(f.size / 1024).toFixed(1)} KB · {new Date(f.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => onDownload(f.id)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Download
          </button>
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
