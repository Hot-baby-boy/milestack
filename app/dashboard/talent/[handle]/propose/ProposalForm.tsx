"use client";

import { useState } from "react";
import Link from "next/link";
import { createProposal } from "@/lib/talent/actions";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none";

export function ProposalForm({ freelancerId }: { freelancerId: string }) {
  const [rows, setRows] = useState([0]);
  const [nextId, setNextId] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createProposal(formData);
    setPending(false);
    if ("error" in result) { setError(result.error); return; }
    setLink(`${window.location.origin}/proposal/${result.token}`);
  }

  if (link) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-[15px] font-bold text-emerald-800">Your project link is ready</h2>
        <p className="mt-1 text-[13px] text-emerald-700">
          Send this to the freelancer on LinkedIn. It works once and expires in 14 days.
        </p>
        <div className="mt-3 flex gap-2">
          <input readOnly value={link} className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700" />
          <button
            onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <Link href="/dashboard/talent" className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline">
          Back to Talent →
        </Link>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="freelancer_id" value={freelancerId} />
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Project name</label>
        <input name="name" required placeholder="e.g. Brand identity for Lagos Retail Co." className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Message / brief (optional)</label>
        <textarea name="description" rows={3} placeholder="What you need, timelines, anything you've agreed." className={inputClass} />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Milestones (NGN)</label>
        <div className="space-y-2">
          {rows.map((id) => (
            <div key={id} className="flex gap-2">
              <input name="milestone_title" placeholder="Milestone title" className={inputClass} />
              <input name="milestone_amount" type="number" min="0" step="0.01" placeholder="Amount" className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              {rows.length > 1 && (
                <button type="button" onClick={() => setRows(rows.filter((r) => r !== id))}
                  className="rounded-lg border border-slate-200 px-3 text-slate-400 hover:text-red-500">×</button>
              )}
            </div>
          ))}
        </div>
        {rows.length < 10 && (
          <button type="button" onClick={() => { setRows([...rows, nextId]); setNextId(nextId + 1); }}
            className="mt-2 text-sm font-medium text-emerald-600 hover:underline">+ Add milestone</button>
        )}
      </div>

      {error && <p className="text-[13px] text-red-600">{error}</p>}
      <button type="submit" disabled={pending}
        className="rounded-xl bg-emerald-500 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
        {pending ? "Creating…" : "Create project link"}
      </button>
    </form>
  );
}
