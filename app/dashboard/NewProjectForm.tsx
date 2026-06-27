"use client";

import { useState } from "react";
import { createProject } from "@/lib/projects/actions";

export function NewProjectForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createProject(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="whitespace-nowrap rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 sm:px-4"
      >
        + New workspace
      </button>
    );
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          name="name"
          type="text"
          required
          autoFocus
          placeholder="Workspace name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending}
          className="flex-1 whitespace-nowrap rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 sm:flex-none"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
