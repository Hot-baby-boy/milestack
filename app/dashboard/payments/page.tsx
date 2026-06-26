import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role ?? "freelancer";

  const { data: projects } = await supabase
    .from("projects").select("id").order("created_at", { ascending: false });
  const ids = (projects ?? []).map(p => p.id);

  const { data: milestones } = ids.length
    ? await supabase.from("milestones").select("id, project_id, title, amount, currency, status, updated_at").in("project_id", ids)
    : { data: [] as { id: string; project_id: string; title: string; amount: number; currency: string; status: string; updated_at: string }[] };

  const ms = milestones ?? [];
  const currency = ms[0]?.currency ?? "USD";
  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const released   = ms.filter(m => m.status === "released").reduce((s, m) => s + Number(m.amount), 0);
  const inEscrow   = ms.filter(m => ["funded","in_progress","submitted","approved"].includes(m.status)).reduce((s, m) => s + Number(m.amount), 0);
  const pendingRel = ms.filter(m => m.status === "approved").reduce((s, m) => s + Number(m.amount), 0);

  const { data: ledger } = ids.length
    ? await supabase.from("ledger_entries")
        .select("id, project_id, milestone_id, type, amount, currency, created_at, projects(name)")
        .in("project_id", ids)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as { id: string; project_id: string; milestone_id: string | null; type: string; amount: number; currency: string; created_at: string; projects: { name: string } | null }[] };

  const txTypes: Record<string, { label: string; sign: string; cls: string }> = {
    fund:    { label: "Project funded",      sign: "+", cls: "text-slate-600" },
    release: { label: "Milestone release",   sign: "+", cls: "text-emerald-700" },
    refund:  { label: "Refund",              sign: "−", cls: "text-red-700" },
    payout:  { label: "Payout to bank",      sign: "−", cls: "text-slate-500" },
  };

  const STATS = [
    { label: role === "freelancer" ? "RELEASED TO YOU" : "TOTAL RELEASED", value: fmt(released) },
    { label: "IN ESCROW",         value: fmt(inEscrow) },
    { label: "PENDING RELEASE",   value: fmt(pendingRel) },
  ];

  return (
    <div>
      <div className="sticky top-0 z-30 hidden h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Payments</h1>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Simulated — Phase 1
        </span>
      </div>

      <div className="px-4 py-5 sm:px-8 sm:py-8">
        <p className="mb-4 text-[13px] text-slate-500 sm:mb-6 sm:text-[13.5px]">Escrow balances and transaction history.</p>

        {/* Stat grid */}
        <div className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-4">
          {STATS.map(s => (
            <div key={s.label} className="relative overflow-hidden rounded-[14px] border border-slate-200 bg-white p-[18px]">
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[14px]" style={{background:"linear-gradient(90deg,#34D399,#059669)"}}/>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-slate-400 sm:text-[12px]">{s.label}</div>
              <div className="font-mono text-[16px] font-bold text-[#0F172A] sm:text-[22px]">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Transaction history */}
        <div className="rounded-2xl border border-slate-200 bg-white" style={{background:"linear-gradient(165deg,#fff 0%,#FAFBFD 100%)"}}>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-[16px] font-bold text-[#0F172A]">Transaction history</h2>
          </div>
          {!(ledger?.length) ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              No transactions yet.{" "}
              {role === "client" && (
                <Link href="/dashboard/workspaces" className="text-emerald-700 underline">Fund a milestone to get started.</Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3.5 text-left font-mono text-[11px] uppercase tracking-wider text-slate-400">Transaction</th>
                    <th className="px-4 py-3.5 text-left font-mono text-[11px] uppercase tracking-wider text-slate-400">Workspace</th>
                    <th className="px-4 py-3.5 text-right font-mono text-[11px] uppercase tracking-wider text-slate-400">Amount</th>
                    <th className="px-4 py-3.5 text-left font-mono text-[11px] uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(ledger ?? []).map(tx => {
                    const t = txTypes[tx.type] ?? { label: tx.type, sign: "+", cls: "text-slate-600" };
                    const isCredit = t.sign === "+";
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-[#0F172A]">{t.label}</td>
                        <td className="px-4 py-4 font-mono text-[12.5px] text-slate-500">
                          {(tx.projects as unknown as { name: string } | null)?.name ?? "—"}
                        </td>
                        <td className={`px-4 py-4 text-right font-mono text-[13px] font-semibold ${isCredit ? "text-emerald-700" : "text-slate-500"}`}>
                          {t.sign}{currency} {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
                            tx.type === "release" ? "bg-emerald-50 text-emerald-700" :
                            tx.type === "fund"    ? "bg-slate-100 text-slate-600" :
                            tx.type === "refund"  ? "bg-red-50 text-red-700" :
                            "bg-slate-50 text-slate-500"
                          }`}>
                            {tx.type === "release" ? "RELEASED" : tx.type === "fund" ? "FUNDED" : tx.type.toUpperCase()}
                          </span>
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
