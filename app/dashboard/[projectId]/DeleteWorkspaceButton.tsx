"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteWorkspace } from "@/lib/projects/actions";

export function DeleteWorkspaceButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setPending(true);
    setError(null);
    const result = await deleteWorkspace(projectId);
    setPending(false);
    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dashboard/workspaces");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-600 transition hover:bg-red-50"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
        Delete workspace
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 className="text-[16px] font-bold text-slate-900">Delete workspace?</h2>
            <p className="mt-1.5 text-[13px] text-slate-500">
              This will permanently delete the workspace and all its milestones. This cannot be undone.
            </p>
            <p className="mt-2 text-[12px] text-slate-400">
              Note: workspaces with funded milestones cannot be deleted.
            </p>
            {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setOpen(false); setError(null); }}
                disabled={pending}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >Cancel</button>
              <button
                onClick={handleDelete}
                disabled={pending}
                className="flex-1 rounded-lg bg-red-600 py-2 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >{pending ? "Deleting…" : "Yes, delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
