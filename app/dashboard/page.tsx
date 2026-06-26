import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "./NewProjectForm";
import { NotificationBell } from "@/components/NotificationBell";

const AVATAR_COLORS = [
  "from-orange-500 to-amber-400",
  "from-blue-600 to-blue-400",
  "from-emerald-600 to-emerald-400",
  "from-purple-600 to-purple-400",
  "from-red-600 to-rose-400",
  "from-cyan-600 to-cyan-400",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials2(name: string) {
  return name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  draft:       { label: "DRAFT",             cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  funded:      { label: "FUNDED",            cls: "bg-slate-100 text-[#334155]" },
  in_progress: { label: "IN PROGRESS",       cls: "bg-orange-50 text-[#C2660D]" },
  submitted:   { label: "AWAITING APPROVAL", cls: "bg-purple-50 text-purple-700" },
  approved:    { label: "APPROVED",          cls: "bg-blue-50 text-blue-700" },
  released:    { label: "RELEASED",          cls: "bg-emerald-50 text-emerald-700" },
  disputed:    { label: "DISPUTED",          cls: "bg-red-50 text-red-700" },
};

function Pill({ status }: { status: string }) {
  const p = STATUS_PILL[status] ?? { label: status.toUpperCase(), cls: "bg-slate-100 text-slate-500" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-wide ${p.cls}`}>
      {p.label}
    </span>
  );
}

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
    .select("id, code, name, status, client_id, freelancer_id, created_at")
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map(p => p.id);

  const { data: milestones } = projectIds.length
    ? await supabase
        .from("milestones")
        .select("id, project_id, title, amount, currency, status, due_date")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; project_id: string; title: string; amount: number; currency: string; status: string; due_date: string | null }[] };

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, project_id, type, payload, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const ms = milestones ?? [];
  const currency = ms[0]?.currency ?? "USD";
  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const released   = ms.filter(m => m.status === "released").reduce((s, m) => s + Number(m.amount), 0);
  const inEscrow   = ms.filter(m => ["funded","in_progress","submitted","approved"].includes(m.status)).reduce((s, m) => s + Number(m.amount), 0);
  const pendingRel = ms.filter(m => m.status === "approved").reduce((s, m) => s + Number(m.amount), 0);
  const lifetime   = ms.reduce((s, m) => s + Number(m.amount), 0);

  const unreadCount = (notifications ?? []).filter(n => !n.read_at).length;

  // Active orders = milestones that need attention or are in motion, deduplicated per project
  const activeProjectIds = new Set<string>();
  const activeOrders: typeof ms = [];
  for (const m of ms) {
    if (["funded","in_progress","submitted","approved","disputed"].includes(m.status) && !activeProjectIds.has(m.project_id)) {
      activeProjectIds.add(m.project_id);
      activeOrders.push(m);
    }
  }

  const projectById = Object.fromEntries((projects ?? []).map(p => [p.id, p]));

  function projectProgress(projectId: string) {
    const pms = ms.filter(m => m.project_id === projectId);
    const total = pms.reduce((s, m) => s + Number(m.amount), 0);
    const rel = pms.filter(m => m.status === "released").reduce((s, m) => s + Number(m.amount), 0);
    const pct = total > 0 ? Math.round((rel / total) * 100) : 0;
    return { total, rel, pct };
  }

  function projectOverallStatus(projectId: string): string {
    const pms = ms.filter(m => m.project_id === projectId);
    if (!pms.length) return "draft";
    if (pms.some(m => m.status === "disputed")) return "disputed";
    if (pms.some(m => m.status === "submitted")) return "submitted";
    if (pms.some(m => m.status === "in_progress")) return "in_progress";
    if (pms.some(m => m.status === "funded")) return "funded";
    if (pms.some(m => m.status === "approved")) return "approved";
    if (pms.every(m => m.status === "released")) return "released";
    return "draft";
  }

  // Seller badge stats
  const completedProjects = (projects ?? []).filter(p => {
    const pms = ms.filter(m => m.project_id === p.id);
    return pms.length > 0 && pms.every(m => m.status === "released");
  }).length;

  const disputedMilestones = ms.filter(m => m.status === "disputed");
  const needsAction = role === "freelancer"
    ? ms.filter(m => m.status === "funded").length
    : ms.filter(m => m.status === "submitted").length;

  return (
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 hidden h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Dashboard</h1>
        <div className="flex items-center gap-3">
          <NotificationBell notifications={notifications ?? []} unreadCount={unreadCount}/>
          {role === "freelancer" && <NewProjectForm/>}
        </div>
      </div>

      <div className="px-4 py-8 sm:px-8 sm:py-9">

        {/* Greeting + seller badge */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[21px] font-bold tracking-tight text-[#0F172A]">Welcome back, {firstName} 👋</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">
              {needsAction > 0
                ? `You have ${needsAction} milestone${needsAction !== 1 ? "s" : ""} waiting for action.`
                : activeOrders.length > 0
                  ? `${activeOrders.length} active order${activeOrders.length !== 1 ? "s" : ""} in progress.`
                  : "Everything is up to date — no action needed."}
            </p>
          </div>
          {(completedProjects > 0 || (projects?.length ?? 0) > 0) && (
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] text-slate-500">
              <span><span className="text-amber-400">★</span> <strong className="text-[#0F172A]">Top rated</strong></span>
              <span className="h-3.5 w-px bg-slate-300"/>
              <span><strong className="text-[#0F172A]">{projects?.length ?? 0}</strong> projects</span>
              <span className="h-3.5 w-px bg-slate-300"/>
              <span><strong className="text-[#0F172A]">{completedProjects}</strong> completed</span>
            </div>
          )}
        </div>

        {/* Dispute attention banner */}
        {disputedMilestones.length > 0 && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-[13.5px] text-red-700">
            <svg className="h-[19px] w-[19px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>
            <span>
              {disputedMilestones.length} dispute{disputedMilestones.length > 1 ? "s are" : " is"} waiting for your response.
            </span>
            <Link href="/dashboard/disputes" className="ml-auto font-bold text-red-700 underline whitespace-nowrap">
              Respond now →
            </Link>
          </div>
        )}

        {/* Earnings card */}
        <div className="relative mb-6 overflow-hidden rounded-[24px] p-[30px_34px] text-white" style={{background:"linear-gradient(155deg,#16223C 0%,#0F172A 50%,#060A14 100%)"}}>
          <div className="pointer-events-none absolute -right-[70px] -top-[130px] h-[360px] w-[360px] rounded-full" style={{background:"radial-gradient(circle,rgba(16,185,129,0.22),transparent 70%)"}}/>
          <div className="relative flex flex-wrap items-end gap-8 sm:gap-[36px]">
            <div>
              <div className="mb-2.5 font-mono text-[12px] uppercase tracking-[0.07em] text-slate-400">
                {role === "freelancer" ? "Available to withdraw" : "Total released to freelancers"}
              </div>
              <div className="font-mono text-[40px] font-extrabold leading-none tracking-tight">{fmt(released)}</div>
              {role === "freelancer" && released > 0 && (
                <Link href="/dashboard/payments"
                  className="mt-4 inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
                >
                  View payments →
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-[28px] sm:gap-[34px] ml-auto">
              <div>
                <div className="mb-1.5 font-mono text-[11.5px] uppercase tracking-[0.04em] text-slate-400">In escrow</div>
                <div className="font-mono text-[19px] font-bold">{fmt(inEscrow)}</div>
              </div>
              <div>
                <div className="mb-1.5 font-mono text-[11.5px] uppercase tracking-[0.04em] text-slate-400">Pending release</div>
                <div className="font-mono text-[19px] font-bold">{fmt(pendingRel)}</div>
              </div>
              <div>
                <div className="mb-1.5 font-mono text-[11.5px] uppercase tracking-[0.04em] text-slate-400">Earned lifetime</div>
                <div className="font-mono text-[19px] font-bold">{fmt(lifetime)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white" style={{background:"linear-gradient(165deg,#FFFFFF 0%,#FAFBFD 100%)"}}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-[16px] font-bold text-[#0F172A]">Active orders</h2>
              <Link href="/dashboard/workspaces" className="text-[13px] font-semibold text-emerald-700 hover:text-emerald-600">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {activeOrders.slice(0, 5).map(m => {
                const project = projectById[m.project_id];
                if (!project) return null;
                const clientName = project.name;
                const color = avatarColor(clientName);
                const inits = initials2(clientName);
                const isAction = (role === "freelancer" && m.status === "funded") ||
                                 (role === "client" && m.status === "submitted");
                return (
                  <Link key={m.id} href={`/dashboard/${m.project_id}`}
                    className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50"
                  >
                    <div className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} font-mono text-[13px] font-bold text-white`}>
                      {inits}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-[14.5px] font-semibold text-[#0F172A]">{project.name}</h5>
                      <div className="mt-0.5 truncate text-[12.5px] text-slate-500">
                        {m.title} · {fmt(Number(m.amount))}
                      </div>
                    </div>
                    {m.due_date && (
                      <span className="hidden shrink-0 font-mono text-[12.5px] text-slate-400 sm:block">
                        Due {m.due_date}
                      </span>
                    )}
                    <Pill status={m.status}/>
                    <span className={`ml-1 flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      isAction
                        ? "bg-[#0F172A] text-white hover:bg-[#1E293B]"
                        : "border border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}>
                      {isAction ? (role === "freelancer" ? "Start" : "Approve") : "View"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Workspaces grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#0F172A]">
            {(projects?.length ?? 0) > 0 ? "Workspaces" : "Get started"}
          </h2>
          <div className="flex items-center gap-3">
            {(projects?.length ?? 0) > 0 && (
              <Link href="/dashboard/workspaces" className="text-[13px] font-semibold text-emerald-700 hover:text-emerald-600">
                View all →
              </Link>
            )}
            {role === "freelancer" && (
              <div className="lg:hidden"><NewProjectForm/></div>
            )}
          </div>
        </div>

        {!(projects?.length) ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
            {role === "freelancer" ? (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                  <svg className="h-7 w-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                </div>
                <h3 className="mb-2 text-[15px] font-bold text-[#0F172A]">Create your first workspace</h3>
                <p className="mb-6 text-sm text-slate-500">A workspace secures one project — milestones, payments, files, and chat in one place.</p>
                <ol className="mx-auto mb-6 max-w-xs space-y-2.5 text-left text-sm text-slate-500">
                  {["Click \"New Workspace\" — takes 30 seconds","Share the invite link with your client","Add milestones and get paid as you deliver"].map((s, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">{i+1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <NewProjectForm/>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                  <svg className="h-7 w-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                </div>
                <h3 className="mb-2 text-[15px] font-bold text-[#0F172A]">Waiting for your invite link</h3>
                <p className="mb-1 text-sm text-slate-500">Your freelancer will share a link to join their workspace.</p>
                <p className="text-xs text-slate-400">Once you join, you&apos;ll fund milestones and release payments right here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
            {(projects ?? []).slice(0, 6).map(project => {
              const { total, rel, pct } = projectProgress(project.id);
              const overallStatus = projectOverallStatus(project.id);
              const color = avatarColor(project.name);
              const inits = initials2(project.name);
              const pill = STATUS_PILL[overallStatus] ?? STATUS_PILL.draft;

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
                      <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background:"linear-gradient(90deg,#059669,#34D399)"}}/>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-slate-500">
                        {total > 0 ? `${fmt(rel)} of ${fmt(total)} released` : (!project.client_id ? "Awaiting client" : "No milestones yet")}
                      </span>
                      <span className="font-mono text-[12px] font-semibold text-slate-500">{pct}%</span>
                    </div>
                  </div>

                  {!project.client_id && (
                    <p className="text-[12px] font-medium text-amber-600">⏳ Client hasn&apos;t joined yet</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {(projects?.length ?? 0) > 6 && (
          <div className="mt-4 text-center">
            <Link href="/dashboard/workspaces" className="text-sm font-semibold text-emerald-700 hover:text-emerald-600">
              View all {projects!.length} workspaces →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
