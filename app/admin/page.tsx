import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, adminLogout } from "./actions";
import { Logo } from "@/components/Logo";
import { ProjectSearch } from "./ProjectSearch";

export default async function AdminConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; tab?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { code, tab = "projects" } = await searchParams;

  // ---- Project lookup by code ----
  let foundProject: {
    id: string;
    code: string;
    name: string;
    status: string;
    created_at: string;
    freelancer: { email: string; display_name: string | null } | null;
    client: { email: string; display_name: string | null } | null;
    milestones: { id: string; title: string; amount: number; currency: string; status: string }[];
    transactions: { id: string; type: string; amount: number; currency: string; created_at: string }[];
  } | null = null;

  if (code) {
    const { data: project } = await supabase
      .from("projects")
      .select("id, code, name, status, created_at, freelancer_id, client_id")
      .eq("code", code.toUpperCase())
      .single();

    if (project) {
      const [freelancerRes, clientRes, milestonesRes, txRes] = await Promise.all([
        supabase.from("profiles").select("email, display_name").eq("id", project.freelancer_id).single(),
        project.client_id
          ? supabase.from("profiles").select("email, display_name").eq("id", project.client_id).single()
          : Promise.resolve({ data: null }),
        supabase.from("milestones").select("id, title, amount, currency, status").eq("project_id", project.id).order("created_at"),
        supabase.from("transactions").select("id, type, amount, currency, created_at").eq("project_id", project.id).order("created_at"),
      ]);

      foundProject = {
        ...project,
        freelancer: freelancerRes.data,
        client: clientRes.data,
        milestones: milestonesRes.data ?? [],
        transactions: txRes.data ?? [],
      };
    }
  }

  // ---- Users list ----
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, role, display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  // ---- Audit log ----
  const { data: auditLog } = await supabase
    .from("admin_audit_log")
    .select("id, action, target_type, target_id, payload, created_at, admin_id")
    .order("created_at", { ascending: false })
    .limit(50);

  // ---- Recent milestone events ----
  const { data: milestoneEvents } = await supabase
    .from("milestone_events")
    .select("id, milestone_id, from_status, to_status, actor_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Admin header */}
      <header className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-3">
        <div className="flex items-center gap-2 font-bold">
          <Logo size={22} />
          <span>Milestack</span>
          <span className="ml-1 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-slate-900">
            ADMIN
          </span>
        </div>
        <form action={adminLogout}>
          <button className="text-sm font-medium text-slate-400 hover:text-white">Sign out</button>
        </form>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* Project code search */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Project lookup
          </h2>
          <ProjectSearch defaultCode={code ?? ""} />
        </div>

        {/* Project result */}
        {code && !foundProject && (
          <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800 p-4 text-sm text-slate-400">
            No project found for code <span className="font-mono text-white">{code.toUpperCase()}</span>.
          </div>
        )}

        {foundProject && (
          <div className="mb-8 rounded-xl border border-amber-500/30 bg-slate-800 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{foundProject.name}</h3>
                  <span className="font-mono text-xs text-amber-400">{foundProject.code}</span>
                  <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300 capitalize">
                    {foundProject.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Created {new Date(foundProject.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-700/50 p-3">
                <p className="text-xs font-medium text-slate-400">Freelancer</p>
                <p className="mt-1 text-sm text-white">{foundProject.freelancer?.display_name ?? "—"}</p>
                <p className="text-xs text-slate-400">{foundProject.freelancer?.email}</p>
              </div>
              <div className="rounded-lg bg-slate-700/50 p-3">
                <p className="text-xs font-medium text-slate-400">Client</p>
                {foundProject.client ? (
                  <>
                    <p className="mt-1 text-sm text-white">{foundProject.client.display_name ?? "—"}</p>
                    <p className="text-xs text-slate-400">{foundProject.client.email}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">Not yet joined</p>
                )}
              </div>
            </div>

            {foundProject.milestones.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-slate-400">Milestones</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700 text-left text-slate-400">
                        <th className="pb-1 pr-4">Title</th>
                        <th className="pb-1 pr-4">Amount</th>
                        <th className="pb-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foundProject.milestones.map((m) => (
                        <tr key={m.id} className="border-b border-slate-700/50">
                          <td className="py-1.5 pr-4 text-white">{m.title}</td>
                          <td className="py-1.5 pr-4 text-slate-300">
                            {m.currency} {Number(m.amount).toLocaleString()}
                          </td>
                          <td className="py-1.5">
                            <span className="rounded bg-slate-700 px-1.5 py-0.5 capitalize text-slate-300">
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {foundProject.transactions.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-slate-400">Ledger</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700 text-left text-slate-400">
                        <th className="pb-1 pr-4">Type</th>
                        <th className="pb-1 pr-4">Amount</th>
                        <th className="pb-1">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foundProject.transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-700/50">
                          <td className="py-1.5 pr-4 capitalize text-white">{tx.type}</td>
                          <td className="py-1.5 pr-4 text-slate-300">
                            {tx.currency} {Number(tx.amount).toLocaleString()}
                          </td>
                          <td className="py-1.5 text-slate-400">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab nav */}
        <div className="mb-6 flex gap-4 border-b border-slate-700">
          {(["users", "audit"] as const).map((t) => (
            <Link
              key={t}
              href={`/admin?tab=${t}${code ? `&code=${code}` : ""}`}
              className={`pb-2 text-sm font-medium capitalize transition ${
                tab === t
                  ? "border-b-2 border-amber-400 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "audit" ? "Audit log" : "Users"}
            </Link>
          ))}
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800 text-left text-xs text-slate-400">
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="px-4 py-2 text-white">{u.email}</td>
                    <td className="px-4 py-2 text-slate-300">{u.display_name ?? "—"}</td>
                    <td className="px-4 py-2 capitalize text-slate-400">{u.role}</td>
                    <td className="px-4 py-2 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!users?.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit log tab */}
        {tab === "audit" && (
          <div className="space-y-6">
            {milestoneEvents?.length ? (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Milestone events
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-800 text-left text-xs text-slate-400">
                        <th className="px-4 py-2">Milestone</th>
                        <th className="px-4 py-2">Transition</th>
                        <th className="px-4 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milestoneEvents.map((e) => (
                        <tr key={e.id} className="border-b border-slate-700/50">
                          <td className="px-4 py-2 font-mono text-xs text-slate-400">{e.milestone_id.slice(0, 8)}…</td>
                          <td className="px-4 py-2 text-white">
                            {e.from_status ?? "—"} → {e.to_status}
                          </td>
                          <td className="px-4 py-2 text-slate-400">
                            {new Date(e.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {auditLog?.length ? (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Admin actions
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-800 text-left text-xs text-slate-400">
                        <th className="px-4 py-2">Action</th>
                        <th className="px-4 py-2">Target</th>
                        <th className="px-4 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((a) => (
                        <tr key={a.id} className="border-b border-slate-700/50">
                          <td className="px-4 py-2 capitalize text-white">{a.action.replace(/_/g, " ")}</td>
                          <td className="px-4 py-2 text-slate-400">
                            {a.target_type}: {a.target_id ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-slate-400">
                            {new Date(a.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {!auditLog?.length && !milestoneEvents?.length && (
              <p className="text-sm text-slate-500">No audit entries yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
