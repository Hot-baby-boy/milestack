import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { NewProjectForm } from "./NewProjectForm";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "client";

  const { data: projects } = await supabase
    .from("projects")
    .select("id, code, name, status, client_id, freelancer_id")
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map((p) => p.id);

  const { data: milestones } = projectIds.length
    ? await supabase
        .from("milestones")
        .select("id, project_id, amount, currency, status")
        .in("project_id", projectIds)
    : { data: [] as { id: string; project_id: string; amount: number; currency: string; status: string }[] };

  const ms = milestones ?? [];

  // ---------- summary numbers ----------
  const totalReleased = ms
    .filter((m) => m.status === "released")
    .reduce((s, m) => s + Number(m.amount), 0);

  const totalInEscrow = ms
    .filter((m) => ["funded", "in_progress", "submitted", "approved"].includes(m.status))
    .reduce((s, m) => s + Number(m.amount), 0);

  const needsAction = role === "freelancer"
    ? ms.filter((m) => m.status === "funded").length          // freelancer: start work
    : ms.filter((m) => m.status === "submitted").length;      // client: approve/reject

  const awaitingApproval = ms.filter((m) => m.status === "approved").length; // released by client

  function budgetFor(projectId: string) {
    const projectMs = ms.filter((m) => m.project_id === projectId);
    const total = projectMs.reduce((s, m) => s + Number(m.amount), 0);
    const released = projectMs.filter((m) => m.status === "released").reduce((s, m) => s + Number(m.amount), 0);
    return { total, released };
  }

  const currency = ms[0]?.currency ?? "USD";
  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="mx-auto max-w-4xl px-6 py-8">

        {/* Summary cards */}
        {ms.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {role === "freelancer" ? (
              <>
                <SummaryCard
                  label="Total earned"
                  value={fmt(totalReleased)}
                  color="emerald"
                />
                <SummaryCard
                  label="In escrow"
                  value={fmt(totalInEscrow)}
                  color="blue"
                />
                <SummaryCard
                  label="Milestones to start"
                  value={String(needsAction)}
                  color={needsAction > 0 ? "amber" : "slate"}
                  sub={needsAction > 0 ? "Funded — ready for you" : "All caught up"}
                />
              </>
            ) : (
              <>
                <SummaryCard
                  label="Total funded"
                  value={fmt(totalInEscrow + totalReleased)}
                  color="blue"
                />
                <SummaryCard
                  label="Awaiting your approval"
                  value={String(needsAction)}
                  color={needsAction > 0 ? "amber" : "slate"}
                  sub={needsAction > 0 ? "Submitted for review" : "Nothing pending"}
                />
                <SummaryCard
                  label="Ready to release"
                  value={String(awaitingApproval)}
                  color={awaitingApproval > 0 ? "emerald" : "slate"}
                  sub={awaitingApproval > 0 ? "Approved milestones" : "None yet"}
                />
              </>
            )}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Workspaces</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/profile"
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Profile
            </Link>
            {role === "freelancer" && <NewProjectForm />}
          </div>
        </div>

        {!projects?.length && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white px-8 py-12 text-center">
            {role === "freelancer" ? (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">Create your first workspace</h3>
                <p className="mb-4 text-sm text-slate-500">A workspace holds all milestones, payments, and messages for one client project.</p>
                <ol className="mx-auto mb-6 max-w-xs space-y-2 text-left text-sm text-slate-500">
                  <li className="flex gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">1</span>Click &quot;New Workspace&quot; above</li>
                  <li className="flex gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">2</span>Share the invite link with your client</li>
                  <li className="flex gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">3</span>Add milestones and get to work</li>
                </ol>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">Waiting for your invite link</h3>
                <p className="mb-2 text-sm text-slate-500">Your freelancer will send you a link to join their workspace.</p>
                <p className="text-xs text-slate-400">Once you join, you&apos;ll be able to review milestones and release payments here.</p>
              </>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {projects?.map((project) => {
            const { total, released } = budgetFor(project.id);
            const pct = total > 0 ? Math.round((released / total) * 100) : 0;
            const pendingCount = ms.filter(
              (m) => m.project_id === project.id &&
                (role === "freelancer" ? m.status === "funded" : m.status === "submitted")
            ).length;
            return (
              <Link
                key={project.id}
                href={`/dashboard/${project.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{project.name}</h3>
                  <span className="font-mono text-xs text-slate-400">{project.code}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {project.client_id ? "Client joined" : "Awaiting client"}
                </p>
                {pendingCount > 0 && (
                  <p className="mt-1 text-xs font-medium text-amber-600">
                    {pendingCount} milestone{pendingCount > 1 ? "s" : ""} need{pendingCount === 1 ? "s" : ""} attention
                  </p>
                )}
                {total > 0 && (
                  <>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {fmt(released)} of {fmt(total)} released
                    </p>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: "emerald" | "blue" | "amber" | "slate";
  sub?: string;
}) {
  const ring: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50",
    blue: "border-blue-200 bg-blue-50",
    amber: "border-amber-200 bg-amber-50",
    slate: "border-slate-200 bg-white",
  };
  const text: Record<string, string> = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
    slate: "text-slate-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${ring[color]}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${text[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
