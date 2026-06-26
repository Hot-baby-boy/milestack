import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DisputesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects").select("id, name, code").order("created_at", { ascending: false });
  const ids = (projects ?? []).map(p => p.id);
  const projectMap = Object.fromEntries((projects ?? []).map(p => [p.id, p]));

  const { data: milestones } = ids.length
    ? await supabase
        .from("milestones")
        .select("id, project_id, title, amount, currency, status, updated_at")
        .eq("status", "disputed")
        .in("project_id", ids)
        .order("updated_at", { ascending: false })
    : { data: [] as { id: string; project_id: string; title: string; amount: number; currency: string; status: string; updated_at: string }[] };

  const currency = (milestones ?? [])[0]?.currency ?? "USD";
  const fmt = (n: number) => `${currency} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="sticky top-0 z-30 hidden h-[72px] items-center border-b border-slate-200 bg-white px-8 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Dispute Center</h1>
      </div>

      <div className="px-4 py-5 sm:px-8 sm:py-8">
        <h2 className="mb-1 text-[18px] font-bold text-[#0F172A] lg:hidden">Disputes</h2>
        <p className="mb-4 text-[13px] text-slate-500 sm:mb-6 sm:text-[13.5px]">Open cases, evidence, and resolutions.</p>

        {!(milestones?.length) ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <svg className="h-7 w-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
            </div>
            <h3 className="mb-1 text-[15px] font-bold text-[#0F172A]">No open disputes</h3>
            <p className="text-sm text-slate-500">All your milestones are in good standing. Keep it up.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(milestones ?? []).map(m => {
              const project = projectMap[m.project_id];
              return (
                <div key={m.id} className="rounded-[14px] border border-slate-200 bg-white p-[22px]">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h5 className="text-[15px] font-bold text-[#0F172A]">{m.title} · {fmt(m.amount)}</h5>
                      <div className="mt-1 font-mono text-[12.5px] text-slate-400">
                        {project?.name} · {project?.code} · Opened {new Date(m.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <span className="rounded-full bg-red-50 px-2.5 py-1 font-mono text-[10px] font-semibold text-red-700">
                      UNDER REVIEW
                    </span>
                  </div>
                  <p className="mb-4 text-[13.5px] text-slate-500">
                    This milestone is under dispute. Both parties can submit evidence. Milestack will review and resolve within 48 hours.
                  </p>
                  <Link href={`/dashboard/${m.project_id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    View workspace & submit evidence →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
