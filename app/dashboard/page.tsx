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
          <p className="text-sm text-slate-500">
            {role === "freelancer"
              ? "No workspaces yet — create one to get started."
              : "No workspaces yet. Ask your freelancer for an invite link."}
          </p>
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
