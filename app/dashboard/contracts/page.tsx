import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  signed:    { label: "SIGNED",              cls: "bg-emerald-50 text-emerald-700" },
  pending:   { label: "AWAITING SIGNATURE",  cls: "bg-purple-50 text-purple-700" },
  draft:     { label: "DRAFT",               cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  unsigned:  { label: "AWAITING SIGNATURE",  cls: "bg-purple-50 text-purple-700" },
};

export default async function ContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, code, name, client_id, created_at")
    .order("created_at", { ascending: false });

  const ids = (projects ?? []).map(p => p.id);

  const { data: contracts } = ids.length
    ? await supabase
        .from("contracts")
        .select("id, project_id, status, created_at")
        .in("project_id", ids)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; project_id: string; status: string; created_at: string }[] };

  const contractByProject = Object.fromEntries((contracts ?? []).map(c => [c.project_id, c]));

  const { data: signatures } = contracts?.length
    ? await supabase
        .from("contract_signatures")
        .select("contract_id, signed_at")
        .in("contract_id", (contracts ?? []).map(c => c.id))
    : { data: [] as { contract_id: string; signed_at: string }[] };

  const sigCountByContract: Record<string, number> = {};
  for (const sig of (signatures ?? [])) {
    sigCountByContract[sig.contract_id] = (sigCountByContract[sig.contract_id] ?? 0) + 1;
  }

  return (
    <div>
      <div className="sticky top-0 z-30 hidden h-[72px] items-center border-b border-slate-200 bg-white pl-8 pr-16 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Contracts</h1>
      </div>

      <div className="px-4 py-5 sm:px-8 sm:py-8">
        <h2 className="mb-1 text-[18px] font-bold text-[#0F172A] lg:hidden">Contracts</h2>
        <p className="mb-4 text-[13px] text-slate-500 sm:mb-6 sm:text-[13.5px]">Scope-of-work agreements generated from your milestones.</p>

        {!(projects?.length) ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
            <h3 className="mb-1 text-[15px] font-bold text-[#0F172A]">No contracts yet</h3>
            <p className="text-sm text-slate-500">Contracts are created inside each workspace.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(projects ?? []).map(project => {
              const contract = contractByProject[project.id];
              const sigCount = contract ? (sigCountByContract[contract.id] ?? 0) : 0;
              const isSigned = sigCount >= 2;
              const status = !contract ? "draft" : isSigned ? "signed" : "pending";
              const pill = STATUS_PILL[status] ?? STATUS_PILL.draft;

              return (
                <Link key={project.id} href={`/dashboard/${project.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] border border-slate-200 bg-slate-50 text-slate-500">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3v4a1 1 0 001 1h4"/>
                      <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>
                      <path d="M9 13h6M9 17h6"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[14.5px] font-semibold text-[#0F172A]">{project.name} · Scope Agreement</h5>
                    <div className="font-mono text-[12.5px] text-slate-400">
                      {project.code}
                      {contract?.created_at && (
                        <> · {isSigned ? "Signed" : "Created"} {new Date(contract.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</>
                      )}
                      {!contract && " · Draft"}
                    </div>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold ${pill.cls}`}>
                    {pill.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
