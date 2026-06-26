import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "./NewProjectForm";
import { NotificationBell } from "@/components/NotificationBell";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, email")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "freelancer";
  const firstName = (profile?.display_name ?? profile?.email ?? "there").split(" ")[0];

  const { data: projects } = await supabase
    .from("projects")
    .select("id, code, name, status, client_id, freelancer_id")
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map(p => p.id);

  const { data: milestones } = projectIds.length
    ? await supabase
        .from("milestones")
        .select("id, project_id, amount, currency, status")
        .in("project_id", projectIds)
    : { data: [] as { id: string; project_id: string; amount: number; currency: string; status: string }[] };

  const ms = milestones ?? [];
  const currency = ms[0]?.currency ?? "USD";
  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const released = ms.filter(m => m.status === "released").reduce((s, m) => s + Number(m.amount), 0);
  const inEscrow = ms.filter(m => ["funded","in_progress","submitted","approved"].includes(m.status)).reduce((s, m) => s + Number(m.amount), 0);
  const pendingRelease = ms.filter(m => m.status === "approved").reduce((s, m) => s + Number(m.amount), 0);
  const needsAction = role === "freelancer"
    ? ms.filter(m => m.status === "funded").length
    : ms.filter(m => m.status === "submitted").length;

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, project_id, type, payload, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const unreadCount = notifications?.filter(n => !n.read_at).length ?? 0;

  function budgetFor(projectId: string) {
    const pms = ms.filter(m => m.project_id === projectId);
    const total = pms.reduce((s, m) => s + Number(m.amount), 0);
    const rel = pms.filter(m => m.status === "released").reduce((s, m) => s + Number(m.amount), 0);
    const pct = total > 0 ? Math.round((rel / total) * 100) : 0;
    return { total, released: rel, pct };
  }

  function pendingFor(projectId: string) {
    return ms.filter(m => m.project_id === projectId &&
      (role === "freelancer" ? m.status === "funded" : m.status === "submitted")).length;
  }

  function statusLabel(p: { client_id: string | null; freelancer_id: string }) {
    const pms = ms.filter(m => m.project_id === p.freelancer_id);
    const statuses = pms.map(m => m.status);
    if (statuses.includes("disputed")) return { label: "DISPUTED", cls: "bg-red-100 text-red-700" };
    if (statuses.includes("submitted")) return { label: "AWAITING APPROVAL", cls: "bg-purple-100 text-purple-700" };
    if (statuses.includes("in_progress")) return { label: "IN PROGRESS", cls: "bg-orange-100 text-orange-700" };
    if (statuses.includes("funded")) return { label: "FUNDED", cls: "bg-slate-100 text-slate-600" };
    if (statuses.every(s => s === "released") && statuses.length > 0) return { label: "COMPLETE", cls: "bg-emerald-100 text-emerald-700" };
    return { label: "ACTIVE", cls: "bg-blue-100 text-blue-700" };
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-slate-200 bg-white px-8 py-0 lg:flex" style={{height:72}}>
        <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <NotificationBell notifications={notifications ?? []} unreadCount={unreadCount}/>
          {role === "freelancer" && <NewProjectForm/>}
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Greeting */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Welcome back, {firstName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {needsAction > 0
                ? `You have ${needsAction} milestone${needsAction > 1 ? "s" : ""} that need${needsAction === 1 ? "s" : ""} attention.`
                : "Everything looks good — no action needed right now."}
            </p>
          </div>
        </div>

        {/* Earnings / escrow card */}
        {ms.length > 0 && (
          <div className="relative mb-6 overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8">
            <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(400px 260px at 100% 0%, rgba(16,185,129,0.20), transparent 70%)"}}/>
            <div className="relative flex flex-wrap items-end gap-6 sm:gap-10">
              <div>
                <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  {role === "freelancer" ? "Total earned" : "Total funded"}
                </div>
                <div className="font-mono text-4xl font-extrabold tracking-tight text-white">{fmt(released)}</div>
              </div>
              <div className="flex flex-wrap gap-8 sm:gap-10">
                <div>
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">In escrow</div>
                  <div className="font-mono text-xl font-bold text-white">{fmt(inEscrow)}</div>
                </div>
                <div>
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">Pending release</div>
                  <div className="font-mono text-xl font-bold text-white">{fmt(pendingRelease)}</div>
                </div>
                {needsAction > 0 && (
                  <div>
                    <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                      {role === "freelancer" ? "Ready to start" : "Awaiting approval"}
                    </div>
                    <div className="font-mono text-xl font-bold text-amber-400">{needsAction}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Workspaces */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {projects?.length ? "Active workspaces" : "Workspaces"}
          </h2>
          {role === "freelancer" && (
            <div className="lg:hidden">
              <NewProjectForm/>
            </div>
          )}
        </div>

        {!projects?.length ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
            {role === "freelancer" ? (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                </div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">Create your first workspace</h3>
                <p className="mb-5 text-sm text-slate-500">A workspace holds all milestones, payments, and messages for one client project.</p>
                <ol className="mx-auto mb-6 max-w-xs space-y-2 text-left text-sm text-slate-500">
                  {["Click \"New Workspace\" above","Share the invite link with your client","Add milestones and get to work"].map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">{i+1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                </div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">Waiting for your invite link</h3>
                <p className="mb-2 text-sm text-slate-500">Your freelancer will send you a link to join their workspace.</p>
                <p className="text-xs text-slate-400">Once you join, you&apos;ll be able to review milestones and release payments here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map(project => {
              const { total, released: rel, pct } = budgetFor(project.id);
              const pending = pendingFor(project.id);
              const avatarLetters = project.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const avatarColors = ["from-orange-500 to-amber-400","from-blue-600 to-blue-400","from-emerald-600 to-emerald-400","from-purple-600 to-purple-400","from-red-600 to-red-400"];
              const colorIdx = project.name.charCodeAt(0) % avatarColors.length;

              return (
                <Link
                  key={project.id}
                  href={`/dashboard/${project.id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarColors[colorIdx]} font-mono text-sm font-bold text-white`}>
                      {avatarLetters}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-slate-900">{project.name}</h4>
                      <p className="font-mono text-[11px] text-slate-400">{project.code}</p>
                    </div>
                    {pending > 0 && (
                      <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-700">
                        {pending} action{pending > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all" style={{width:`${pct}%`}}/>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {total > 0 ? `${fmt(rel)} of ${fmt(total)} released` : (project.client_id ? "No milestones yet" : "Awaiting client")}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{pct}%</span>
                    </div>
                  </div>

                  {!project.client_id && (
                    <p className="text-xs font-medium text-amber-600">Client hasn&apos;t joined yet</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
