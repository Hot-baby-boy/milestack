"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Milestone = {
  id: string; project_id: string; title: string;
  amount: number; currency: string; status: string; due_date: string | null;
  projects: { name: string; code: string } | null;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "funded", label: "Funded" },
  { key: "in_progress", label: "In Progress" },
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "released", label: "Released" },
  { key: "disputed", label: "Disputed" },
];

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  draft:       { label: "DRAFT",             cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  funded:      { label: "FUNDED",            cls: "bg-slate-100 text-[#334155]" },
  in_progress: { label: "IN PROGRESS",       cls: "bg-orange-50 text-[#C2660D]" },
  submitted:   { label: "AWAITING APPROVAL", cls: "bg-purple-50 text-purple-700" },
  approved:    { label: "APPROVED",          cls: "bg-blue-50 text-blue-700" },
  released:    { label: "RELEASED",          cls: "bg-emerald-50 text-emerald-700" },
  disputed:    { label: "DISPUTED",          cls: "bg-red-50 text-red-700" },
};

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("milestones")
        .select("id, project_id, title, amount, currency, status, due_date, projects(name, code)")
        .order("created_at", { ascending: false });
      setMilestones((data as unknown as Milestone[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all" ? milestones : milestones.filter(m => m.status === filter);
  const currency = milestones[0]?.currency ?? "USD";
  const fmt = (n: number) => `${currency} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="sticky top-0 z-30 hidden h-[72px] items-center border-b border-slate-200 bg-white px-8 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Milestones</h1>
      </div>

      <div className="px-4 py-5 sm:px-8 sm:py-8">
        <h2 className="mb-1 text-[18px] font-bold text-[#0F172A] lg:hidden">Milestones</h2>
        <p className="mb-4 text-[13px] text-slate-500 sm:text-[13.5px]">Across every workspace you&apos;re part of.</p>

        {/* Filter pills — scrollable on mobile */}
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0"
          style={{scrollbarWidth:"none"}}>

          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[12.5px] font-semibold transition ${
                filter === f.key
                  ? "border-[#0F172A] bg-[#0F172A] text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {f.label}
              {f.key !== "all" && milestones.filter(m => m.status === f.key).length > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {milestones.filter(m => m.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">Loading milestones…</div>
          ) : !filtered.length ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              No {filter !== "all" ? filter.replace("_", " ") + " " : ""}milestones yet.
            </div>
          ) : (
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3.5 text-left font-mono text-[11px] uppercase tracking-wider text-slate-400">Title</th>
                    <th className="px-4 py-3.5 text-left font-mono text-[11px] uppercase tracking-wider text-slate-400">Workspace</th>
                    <th className="px-4 py-3.5 text-right font-mono text-[11px] uppercase tracking-wider text-slate-400">Amount</th>
                    <th className="px-4 py-3.5 text-left font-mono text-[11px] uppercase tracking-wider text-slate-400">Due</th>
                    <th className="px-4 py-3.5 text-left font-mono text-[11px] uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-4 py-3.5"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(m => {
                    const pill = STATUS_PILL[m.status] ?? STATUS_PILL.draft;
                    return (
                      <tr key={m.id} className="group hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-[#0F172A]">{m.title}</td>
                        <td className="px-4 py-4 font-mono text-[12.5px] text-slate-500">
                          {m.projects?.name ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-[13px] font-semibold text-[#0F172A]">
                          {fmt(m.amount)}
                        </td>
                        <td className="px-4 py-4 font-mono text-[12.5px] text-slate-400">
                          {m.due_date ?? "—"}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ${pill.cls}`}>
                            {pill.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Link href={`/dashboard/${m.project_id}`}
                            className="invisible rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 group-hover:visible"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
