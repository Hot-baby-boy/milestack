import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "@/app/dashboard/NewProjectForm";

const AVATAR_COLORS = [
  "from-orange-500 to-amber-400","from-blue-600 to-blue-400","from-emerald-600 to-emerald-400",
  "from-purple-600 to-purple-400","from-red-600 to-rose-400","from-cyan-600 to-cyan-400",
];

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  draft:       { label: "DRAFT",             cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  funded:      { label: "FUNDED",            cls: "bg-slate-100 text-[#334155]" },
  in_progress: { label: "IN PROGRESS",       cls: "bg-orange-50 text-[#C2660D]" },
  submitted:   { label: "AWAITING APPROVAL", cls: "bg-purple-50 text-purple-700" },
  approved:    { label: "APPROVED",          cls: "bg-blue-50 text-blue-700" },
  released:    { label: "COMPLETE",          cls: "bg-emerald-50 text-emerald-700" },
  disputed:    { label: "DISPUTED",          cls: "bg-red-50 text-red-700" },
};

export default async function WorkspacesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role ?? "freelancer";

  const { data: projects } = await supabase
    .from("projects")
    .select("id, code, name, status, client_id, freelancer_id, created_at")
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map(p => p.id);

  const { data: milestones } = projectIds.length
    ? await supabase
        .from("milestones")
        .select("id, project_id, amount, status, currency")
        .in("project_id", projectIds)
    : { data: [] as { id: string; project_id: string; amount: number; status: string; currency: string }[] };

  const ms = milestones ?? [];
  const currency = ms[0]?.currency ?? "USD";
  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  function projectMeta(projectId: string) {
    const pms = ms.filter(m => m.project_id === projectId);
    const total = pms.reduce((s, m) => s + Number(m.amount), 0);
    const rel = pms.filter(m => m.status === "released").reduce((s, m) => s + Number(m.amount), 0);
    const pct = total > 0 ? Math.round((rel / total) * 100) : 0;
    let status = "draft";
    if (pms.some(m => m.status === "disputed")) status = "disputed";
    else if (pms.some(m => m.status === "submitted")) status = "submitted";
    else if (pms.some(m => m.status === "in_progress")) status = "in_progress";
    else if (pms.some(m => m.status === "funded")) status = "funded";
    else if (pms.some(m => m.status === "approved")) status = "approved";
    else if (pms.length > 0 && pms.every(m => m.status === "released")) status = "released";
    return { total, rel, pct, status, milestoneCount: pms.length };
  }

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-30 hidden h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
        <div>
          <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Workspaces</h1>
        </div>
        {role === "freelancer" && <NewProjectForm/>}
      </div>

      <div className="px-4 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13.5px] text-slate-500">Every active and completed project, in one place.</p>
          </div>
          {role === "freelancer" && (
            <div className="lg:hidden"><NewProjectForm/></div>
          )}
        </div>

        {!(projects?.length) ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <svg className="h-7 w-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
            </div>
            <h3 className="mb-2 text-[15px] font-bold text-[#0F172A]">No workspaces yet</h3>
            <p className="mb-5 text-sm text-slate-500">
              {role === "freelancer"
                ? "Create a workspace to start a protected project with your client."
                : "Your freelancer will invite you to a workspace."}
            </p>
            {role === "freelancer" && <NewProjectForm/>}
          </div>
        ) : (
          <div className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
            {(projects ?? []).map(project => {
              const { total, rel, pct, status, milestoneCount } = projectMeta(project.id);
              const pill = STATUS_PILL[status] ?? STATUS_PILL.draft;
              const color = AVATAR_COLORS[project.name.charCodeAt(0) % AVATAR_COLORS.length];
              const inits = project.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

              return (
                <Link key={project.id} href={`/dashboard/${project.id}`}
                  className="group flex flex-col gap-3.5 rounded-[14px] border border-slate-200 bg-white p-[22px] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} font-mono text-sm font-bold text-white`}>
                      {inits}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[15.5px] font-semibold text-[#0F172A]">{project.name}</h4>
                      <div className="font-mono text-[12.5px] text-slate-400">{project.code}</div>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${pill.cls}`}>
                      {pill.label}
                    </span>
                  </div>

                  <div>
                    <div className="mb-1.5 h-[8px] w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:"linear-gradient(90deg,#059669,#34D399)"}}/>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-slate-500">
                        {total > 0
                          ? `${fmt(rel)} of ${fmt(total)} released`
                          : !project.client_id ? "Awaiting client" : "No milestones yet"}
                      </span>
                      <span className="font-mono font-semibold text-slate-500">{pct}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[12.5px] text-slate-400">
                    <span>{milestoneCount} milestone{milestoneCount !== 1 ? "s" : ""}</span>
                    {!project.client_id && (
                      <span className="font-medium text-amber-600">⏳ Awaiting client</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
