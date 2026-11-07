"use client";

import { useState } from "react";
import Link from "next/link";
import { cancelProposal } from "@/lib/talent/actions";

type Proposal = {
  id: string; name: string; status: string; token: string;
  project_id: string | null; created_at: string;
};

export function ProposalList({ proposals }: { proposals: Proposal[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function copy(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/proposal/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  async function cancel(id: string) {
    const result = await cancelProposal(id);
    if (result?.error) setError(result.error);
  }

  if (!proposals.length) {
    return <p className="text-sm text-slate-400">No project links yet. Open a freelancer&apos;s profile to create one.</p>;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {proposals.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-[14px] font-semibold text-[#0F172A]">{p.name}</p>
            <p className="text-[12px] capitalize text-slate-400">{p.status}</p>
          </div>
          <div className="flex gap-2">
            {p.status === "pending" && (
              <>
                <button onClick={() => copy(p.token)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  {copied === p.token ? "Copied!" : "Copy link"}
                </button>
                <button onClick={() => cancel(p.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                  Cancel
                </button>
              </>
            )}
            {p.status === "accepted" && p.project_id && (
              <Link href={`/dashboard/${p.project_id}`}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">
                Open workspace
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
