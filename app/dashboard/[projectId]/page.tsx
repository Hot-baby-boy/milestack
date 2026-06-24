import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { StatusPill } from "@/components/StatusPill";
import { MilestoneActions } from "./MilestoneActions";
import { NewMilestoneForm } from "./NewMilestoneForm";
import { InviteClientForm } from "./InviteClientForm";
import { CopyLinkBox } from "./CopyLinkBox";
import { TransactionsTable } from "@/components/TransactionsTable";
import { ContractPanel } from "./ContractPanel";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ invited?: string; token?: string }>;
}) {
  const { projectId } = await params;
  const { invited, token } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, code, name, freelancer_id, client_id")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  const isFreelancer = user.id === project.freelancer_id;
  const isClient = user.id === project.client_id;

  const { data: milestones } = await supabase
    .from("milestones")
    .select("id, title, amount, due_date, status")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, type, amount, currency, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, content, status")
    .eq("project_id", projectId)
    .maybeSingle();

  const { data: signatures } = contract
    ? await supabase
        .from("contract_signatures")
        .select("user_id, signed_name, signed_at")
        .eq("contract_id", contract.id)
    : { data: [] };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const inviteLink =
    invited === "1" && token
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${token}`
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500">
            {project.code}
          </span>
        </div>

        {inviteLink && (
          <div className="mt-4">
            <CopyLinkBox link={inviteLink} />
          </div>
        )}

        {!project.client_id && isFreelancer && !inviteLink && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Invite your client</h2>
            <p className="mt-1 text-sm text-slate-500">
              Send them a link to join this workspace, no account required until they accept.
            </p>
            <div className="mt-4 max-w-sm">
              <InviteClientForm projectId={project.id} />
            </div>
          </div>
        )}

        {!project.client_id && !isFreelancer && (
          <p className="mt-6 text-sm text-slate-500">Waiting for the client to join this workspace.</p>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Milestones</h2>
            {isFreelancer && <NewMilestoneForm projectId={project.id} />}
          </div>

          {!milestones?.length ? (
            <p className="p-4 text-sm text-slate-500">No milestones yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Due</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{m.title}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      ${Number(m.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{m.due_date ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MilestoneActions
                        milestoneId={m.id}
                        projectId={project.id}
                        status={m.status}
                        isFreelancer={isFreelancer}
                        isClient={isClient}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Transactions</h2>
          </div>
          <TransactionsTable transactions={transactions ?? []} />
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Scope agreement</h2>
          <ContractPanel
            projectId={project.id}
            isFreelancer={isFreelancer}
            contract={contract ?? null}
            signatures={signatures ?? []}
            freelancerId={project.freelancer_id}
            clientId={project.client_id}
            defaultSignedName={profile?.display_name ?? profile?.email ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
