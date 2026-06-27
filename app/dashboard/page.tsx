import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "./NewProjectForm";
import { NotificationBell } from "@/components/NotificationBell";
import { WithdrawModal } from "@/components/WithdrawModal";

const AVATAR_COLORS = [
  "from-orange-500 to-amber-400","from-blue-600 to-blue-400","from-emerald-600 to-emerald-400",
  "from-purple-600 to-purple-400","from-red-600 to-rose-400","from-cyan-600 to-cyan-400",
];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
function initials2(name: string) { return name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(); }

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  draft:       { label: "DRAFT",             cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  funded:      { label: "FUNDED",            cls: "bg-slate-100 text-[#334155]" },
  in_progress: { label: "IN PROGRESS",       cls: "bg-orange-50 text-[#C2660D]" },
  submitted:   { label: "AWAITING APPROVAL", cls: "bg-purple-50 text-purple-700" },
  approved:    { label: "APPROVED",          cls: "bg-blue-50 text-blue-700" },
  released:    { label: "COMPLETE",          cls: "bg-emerald-50 text-emerald-700" },
  disputed:    { label: "DISPUTED",          cls: "bg-red-50 text-red-700" },
};

function Pill({ status }: { status: string }) {
  const p = STATUS_PILL[status] ?? { label: status.toUpperCase(), cls: "bg-slate-100 text-slate-500" };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${p.cls}`}>{p.label}</span>;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, display_name, email").eq("id", user.id).single();
  const role = profile?.role ?? "freelancer";
  const firstName = (profile?.display_name ?? profile?.email ?? "there").split(" ")[0];

  const { data: projects } = await supabase.from("projects").select("id, code, name, status, client_id, freelancer_id, created_at").order("created_at", { ascending: false });
  const projectIds = (projects ?? []).map(p => p.id);

  const { data: milestones } = projectIds.length
    ? await supabase.from("milestones").select("id, project_id, title, amount, currency, status, due_date").in("project_id", projectIds).order("created_at", { ascending: false })
    : { data: [] as { id: string; project_id: string; title: string; amount: number; currency: string; status: string; due_date: string | null }[] };

  const { data: notifications } = await supabase.from("notifications").select("id, project_id, type, payload, read_at, created_at").order("created_at", { ascending: false }).limit(10);

  const ms = milestones ?? [];
  const currency = ms[0]?.currency ?? "USD";
  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtShort = (n: number) => n >= 1000 ? `${currency} ${(n/1000).toFixed(1)}k` : fmt(n);

  const released   = ms.filter(m => m.status === "released").reduce((s, m) => s + Number(m.amount), 0);
  const inEscrow   = ms.filter(m => ["funded","in_progress","submitted","approved"].includes(m.status)).reduce((s, m) => s + Number(m.amount), 0);
  const pendingRel = ms.filter(m => m.status === "approved").reduce((s, m) => s + Number(m.amount), 0);
  const lifetime   = ms.reduce((s, m) => s + Number(m.amount), 0);
  const unreadCount = (notifications ?? []).filter(n => !n.read_at).length;

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
    return { total, rel, pct: total > 0 ? Math.round((rel / total) * 100) : 0 };
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

  const completedProjects = (projects ?? []).filter(p => {
    const pms = ms.filter(m => m.project_id === p.id);
    return pms.length > 0 && pms.every(m => m.status === "released");
  }).length;

  const disputedMilestones = ms.filter(m => m.status === "disputed");
  const needsAction = role === "freelancer" ? ms.filter(m => m.status === "funded").length : ms.filter(m => m.status === "submitted").length;

  return (
    <div className="flex flex-col">
      {/* Desktop top bar */}
      <div className="sticky top-0 z-30 hidden h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Dashboard</h1>
        <div className="flex items-center gap-3">
          <NotificationBell notifications={notifications ?? []} unreadCount={unreadCount}/>
          {role === "freelancer" && <NewProjectForm/>}
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">

        {/* Greeting */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-tight text-[#0F172A] sm:text-[21px]">Welcome back, {firstName} 👋</h2>
            <p className="mt-1 text-[12.5px] text-slate-500 sm:text-[13.5px]">
              {needsAction > 0 ? `${needsAction} milestone${needsAction !== 1 ? "s" : ""} need${needsAction === 1 ? "s" : ""} action`
                : activeOrders.length > 0 ? `${activeOrders.length} active order${activeOrders.length !== 1 ? "s" : ""}`
                : "Everything is up to date"}
            </p>
          </div>
          {/* Mobile: actions in greeting row. Desktop: actions in sticky top bar */}
          <div className="flex flex-shrink-0 items-center gap-2 lg:hidden">
            <NotificationBell notifications={notifications ?? []} unreadCount={unreadCount}/>
            {role === "freelancer" && <NewProjectForm/>}
          </div>
        </div>

        {/* Dispute banner */}
        {disputedMilestones.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 sm:rounded-2xl sm:text-[13.5px]">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 sm:h-[19px] sm:w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>
            <span className="flex-1">{disputedMilestones.length} dispute{disputedMilestones.length > 1 ? "s" : ""} waiting for response.</span>
            <Link href="/dashboard/disputes" className="flex-shrink-0 font-bold underline">Respond →</Link>
          </div>
        )}

        {/* Earnings card */}
        <div className="relative mb-5 overflow-hidden rounded-2xl p-5 text-white sm:mb-6 sm:rounded-[24px] sm:p-8" style={{background:"linear-gradient(155deg,#16223C 0%,#0F172A 50%,#060A14 100%)"}}>
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full sm:-right-[70px] sm:-top-[130px] sm:h-[360px] sm:w-[360px]" style={{background:"radial-gradient(circle,rgba(16,185,129,0.22),transparent 70%)"}}/>
          <div className="relative">
            {/* Main figure */}
            <div className="mb-4">
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.07em] text-slate-400 sm:text-[12px]">
                {role === "freelancer" ? "Available to withdraw" : "Total released"}
              </div>
              {/* Show currency code small, number large so it doesn't overflow */}
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[13px] font-semibold text-slate-400 sm:text-[16px]">{currency}</span>
                <span className="font-mono text-[28px] font-extrabold leading-none tracking-tight sm:text-[40px]">
                  {released.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {role === "freelancer" && (
                <div className="mt-3 flex items-center gap-2 sm:mt-4">
                  <WithdrawModal available={released} currency={currency}/>
                  <Link href="/dashboard/payments" className="inline-flex h-[34px] items-center rounded-full border border-white/20 px-4 text-[13px] font-semibold text-white/70 hover:text-white transition">
                    Payments →
                  </Link>
                </div>
              )}
            </div>
            {/* Secondary stats — 3-col on mobile */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 sm:flex sm:gap-[34px] sm:border-0 sm:pt-0">
              {[
                { label: "In escrow",    val: inEscrow },
                { label: "Pending",      val: pendingRel },
                { label: "Lifetime",     val: lifetime },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.04em] text-slate-400 sm:text-[11.5px]">{label}</div>
                  <div className="font-mono text-[13px] font-bold sm:text-[19px]">
                    <span className="text-[9px] text-slate-400 sm:text-[12px]">{currency} </span>
                    {val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="text-[15px] font-bold text-[#0F172A] sm:text-[16px]">Active orders</h2>
              <Link href="/dashboard/workspaces" className="text-[12px] font-semibold text-emerald-700 sm:text-[13px]">View all →</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {activeOrders.slice(0, 5).map(m => {
                const project = projectById[m.project_id];
                if (!project) return null;
                const color = avatarColor(project.name);
                const inits = initials2(project.name);
                const isAction = (role === "freelancer" && m.status === "funded") || (role === "client" && m.status === "submitted");
                return (
                  <Link key={m.id} href={`/dashboard/${m.project_id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:gap-4 sm:px-6 sm:py-4">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} font-mono text-[12px] font-bold text-white sm:h-[42px] sm:w-[42px] sm:text-[13px]`}>
                      {inits}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="truncate text-[13.5px] font-semibold text-[#0F172A] sm:text-[14.5px]">{project.name}</h5>
                      <div className="truncate text-[11.5px] text-slate-500 sm:text-[12.5px]">{m.title} · {fmtShort(Number(m.amount))}</div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                      <Pill status={m.status}/>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${isAction ? "bg-[#0F172A] text-white" : "border border-slate-200 text-slate-500"}`}>
                        {isAction ? (role === "freelancer" ? "Start" : "Approve") : "View"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Workspaces grid */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#0F172A] sm:text-[16px]">
            {(projects?.length ?? 0) > 0 ? "Workspaces" : "Get started"}
          </h2>
          <div className="flex items-center gap-3">
            {(projects?.length ?? 0) > 0 && (
              <Link href="/dashboard/workspaces" className="text-[12px] font-semibold text-emerald-700 sm:text-[13px]">View all →</Link>
            )}
          </div>
        </div>

        {!(projects?.length) ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-5 py-10 text-center sm:px-8 sm:py-14">
            {role === "freelancer" ? (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 sm:h-14 sm:w-14">
                  <svg className="h-6 w-6 text-emerald-500 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                </div>
                <h3 className="mb-1.5 text-[14px] font-bold text-[#0F172A] sm:text-[15px]">Create your first workspace</h3>
                <p className="mb-5 text-sm text-slate-500">Secure a project with milestones, payments, and chat — all in one place.</p>
                <ol className="mx-auto mb-5 max-w-xs space-y-2 text-left text-sm text-slate-500">
                  {["Click \"New Workspace\" above","Share the invite link with your client","Add milestones and get paid as you deliver"].map((s, i) => (
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
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                  <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                </div>
                <h3 className="mb-1.5 text-[14px] font-bold text-[#0F172A]">Waiting for your invite link</h3>
                <p className="mb-1 text-sm text-slate-500">Your freelancer will share a link to join their workspace.</p>
                <p className="text-xs text-slate-400">Once you join, you&apos;ll fund milestones and release payments here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {(projects ?? []).slice(0, 6).map(project => {
              const { total, rel, pct } = projectProgress(project.id);
              const overallStatus = projectOverallStatus(project.id);
              const pill = STATUS_PILL[overallStatus] ?? STATUS_PILL.draft;
              const color = avatarColor(project.name);
              const inits = initials2(project.name);
              return (
                <Link key={project.id} href={`/dashboard/${project.id}`}
                  className="flex flex-col gap-3 rounded-[14px] border border-slate-200 bg-white p-4 transition-all hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)] sm:p-[22px]"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} font-mono text-sm font-bold text-white sm:h-10 sm:w-10`}>{inits}</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[14px] font-semibold text-[#0F172A] sm:text-[15.5px]">{project.name}</h4>
                      <div className="font-mono text-[11px] text-slate-400 sm:text-[12.5px]">{project.code}</div>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold sm:text-[10px] ${pill.cls}`}>{pill.label}</span>
                  </div>
                  <div>
                    <div className="mb-1 h-[7px] w-full overflow-hidden rounded-full bg-slate-100 sm:h-[8px]">
                      <div className="h-full rounded-full" style={{width:`${pct}%`,background:"linear-gradient(90deg,#059669,#34D399)"}}/>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] text-slate-500 sm:text-[13px]">
                        {total > 0 ? `${fmtShort(rel)} of ${fmtShort(total)} released` : !project.client_id ? "Awaiting client" : "No milestones yet"}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-500 sm:text-[12px]">{pct}%</span>
                    </div>
                  </div>
                  {!project.client_id && <p className="text-[11.5px] font-medium text-amber-600">⏳ Client hasn&apos;t joined yet</p>}
                </Link>
              );
            })}
          </div>
        )}

        {(projects?.length ?? 0) > 6 && (
          <div className="mt-4 text-center">
            <Link href="/dashboard/workspaces" className="text-sm font-semibold text-emerald-700">View all {projects!.length} workspaces →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
