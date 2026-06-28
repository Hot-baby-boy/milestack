"use client";

import { useState } from "react";
import { inviteClient } from "@/lib/projects/actions";

export function InviteClientButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    formData.set("projectId", projectId);
    const result = await inviteClient(formData);
    setPending(false);
    if (result?.error) setError(result.error);
    // on success inviteClient redirects, so modal closes automatically
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-amber-600 transition"
      >
        Invite client
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="mb-1 text-[16px] font-bold text-[#0F172A]">Invite your client</h2>
              <p className="mb-4 text-[13px] text-slate-500">We&apos;ll generate a secure invite link for you to share.</p>
              <form action={onSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Client name <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    name="clientName"
                    type="text"
                    autoFocus
                    placeholder="e.g. Lagos Retail Co."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Client email</label>
                  <input
                    name="clientEmail"
                    type="email"
                    required
                    placeholder="client@email.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={pending}
                    className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {pending ? "Generating…" : "Generate invite link"}
                  </button>
                  <button type="button" onClick={() => setOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
