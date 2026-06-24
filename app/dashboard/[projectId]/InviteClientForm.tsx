"use client";

import { useState } from "react";
import { inviteClient } from "@/lib/projects/actions";

export function InviteClientForm({ projectId }: { projectId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await inviteClient(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div>
        <label className="block text-sm font-medium text-slate-700">Client name</label>
        <input
          name="clientName"
          type="text"
          placeholder="Lagos Retail Co."
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Client email</label>
        <input
          name="clientEmail"
          type="email"
          required
          placeholder="client@email.com"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {pending ? "Creating link…" : "Generate invite link"}
      </button>
    </form>
  );
}
