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
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, code, name, status, client_id, freelancer_id")
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: milestones } = projectIds.length
    ? await supabase
        .from("milestones")
        .select("project_id, amount, status")
        .in("project_id", projectIds)
    : { data: [] as { project_id: string; amount: number; status: string }[] };

  function budgetFor(projectId: string) {
    const ms = (milestones ?? []).filter((m) => m.project_id === projectId);
    const total = ms.reduce((sum, m) => sum + Number(m.amount), 0);
    const released = ms
      .filter((m) => m.status === "released")
      .reduce((sum, m) => sum + Number(m.amount), 0);
    return { total, released };
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Workspaces</h1>
          {profile?.role === "freelancer" && <NewProjectForm />}
        </div>

        {!projects?.length && (
          <p className="text-sm text-slate-500">
            {profile?.role === "freelancer"
              ? "No workspaces yet — create one to get started."
              : "No workspaces yet. Ask your freelancer for an invite link."}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {projects?.map((project) => {
            const { total, released } = budgetFor(project.id);
            const pct = total > 0 ? Math.round((released / total) * 100) : 0;
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
                {total > 0 && (
                  <>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      ${released.toLocaleString()} of ${total.toLocaleString()} released
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
