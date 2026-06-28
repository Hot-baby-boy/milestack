"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, inviteClient } from "@/lib/projects/actions";

export function NewProjectForm() {
  const router = useRouter();
  const [step, setStep] = useState<"closed" | "name" | "invite">("closed");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function reset() {
    setStep("closed");
    setProjectId(null);
    setError(null);
    setPending(false);
  }

  async function onCreateProject(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createProject(formData);
    setPending(false);
    if ("error" in result) { setError(result.error); return; }
    setProjectId(result.projectId);
    setStep("invite");
  }

  async function onInvite(formData: FormData) {
    if (!projectId) return;
    setError(null);
    setPending(true);
    formData.set("projectId", projectId);
    const result = await inviteClient(formData);
    setPending(false);
    if (result?.error) { setError(result.error); return; }
  }

  function skipInvite() {
    if (projectId) router.push(`/dashboard/${projectId}`);
    reset();
  }

  if (step === "closed") {
    return (
      <button
        onClick={() => setStep("name")}
        className="whitespace-nowrap rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 sm:px-4"
      >
        + New workspace
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={reset} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

          {step === "name" && (
            <>
              <h2 className="mb-1 text-[17px] font-bold text-[#0F172A]">New workspace</h2>
              <p className="mb-5 text-[13px] text-slate-500">Give your project a name to get started.</p>
              <form action={onCreateProject} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Workspace name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Lagos Retail Website"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={pending}
                    className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {pending ? "Creating…" : "Continue →"}
                  </button>
                  <button type="button" onClick={reset}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}

          {step === "invite" && (
            <>
              {/* Step indicator */}
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">✓</div>
                <div className="h-px flex-1 bg-emerald-200" />
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">2</div>
              </div>

              <h2 className="mb-1 text-[17px] font-bold text-[#0F172A]">Invite your client</h2>
              <p className="mb-5 text-[13px] text-slate-500">
                We&apos;ll generate a secure invite link you can send to your client.
              </p>

              <form action={onInvite} className="space-y-4">
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
                  <button type="button" onClick={skipInvite}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Skip
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </>
  );
}
