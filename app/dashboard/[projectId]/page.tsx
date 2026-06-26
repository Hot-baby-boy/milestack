import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusPill } from "@/components/StatusPill";
import { MilestoneActions } from "./MilestoneActions";
import { NewMilestoneForm } from "./NewMilestoneForm";
import { InviteClientForm } from "./InviteClientForm";
import { CopyLinkBox } from "./CopyLinkBox";
import { TransactionsTable } from "@/components/TransactionsTable";
import { ContractPanel } from "./ContractPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { FilesList } from "./FilesList";

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

  const { data: messages } = await supabase
    .from("messages")
    .select("id, project_id, sender_id, type, body, attachment_id, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const { data: files } = await supabase
    .from("files")
    .select("id, name, size, mime, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const inviteLink =
    invited === "1" && token
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${token}`
      : null;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex" style={{height:72}}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-700">← Workspaces</Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-base font-bold text-slate-900">{project.name}</h1>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">{project.code}</span>
        </div>
        {isFreelancer && <NewMilestoneForm projectId={project.id}/>}
      </div>

      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Mobile header */}
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <div>
            <Link href="/dashboard" className="mb-1 block text-xs text-slate-400 hover:text-slate-600">← Workspaces</Link>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{project.name}</h1>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">{project.code}</span>
            </div>
          </div>
          {isFreelancer && <NewMilestoneForm projectId={project.id}/>}
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

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h2 className="text-sm font-bold text-slate-900">Milestones</h2>
          </div>

          {!milestones?.length ? (
            <p className="p-4 text-sm text-slate-500">No milestones yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{m.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      ${Number(m.amount).toLocaleString()}
                      {m.due_date && <> · due {m.due_date}</>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPill status={m.status} />
                    <MilestoneActions
                      milestoneId={m.id}
                      projectId={project.id}
                      status={m.status}
                      isFreelancer={isFreelancer}
                      isClient={isClient}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-bold text-slate-900">Chat</h2>
          </div>
          <ChatPanel
            projectId={project.id}
            currentUserId={user.id}
            isClient={isClient}
            initialMessages={messages ?? []}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Files</h2>
          <FilesList files={files ?? []} />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-bold text-slate-900">Transactions</h2>
          </div>
          <TransactionsTable transactions={transactions ?? []} />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Scope agreement</h2>
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
