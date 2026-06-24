"use client";

import { useState } from "react";
import { createMilestone } from "@/lib/milestones/actions";

export function NewMilestoneForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createMilestone(formData);
    setPending(false);
    if (result?.error) setError(result.error);
    else setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        + Add milestone
      </button>
    );
  }

  return (
    <form action={onSubmit} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid grid-cols-3 gap-3">
        <input
          name="title"
          type="text"
          required
          autoFocus
          placeholder="Milestone title"
          className="col-span-3 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:col-span-1"
        />
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="Amount (USD)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <input
          name="dueDate"
          type="date"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
