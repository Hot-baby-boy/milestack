import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusPill } from "@/components/StatusPill";
import { MilestoneActions } from "./MilestoneActions";
import { NewMilestoneForm } from "./NewMilestoneForm";
import { CopyLinkBox } from "./CopyLinkBox";
import { InviteClientButton } from "./InviteClientButton";
import { DeleteWorkspaceButton } from "./DeleteWorkspaceButton";
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
      {/* Desktop top bar */}
      <div className="sticky top-0 z-30 hidden h-[72px] items-center justify-between border-b border-slate-200 bg-white pl-8 pr-16 lg:flex">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard/workspaces" className="flex-shrink-0 text-sm text-slate-400 hover:text-slate-700">← Workspaces</Link>
          <span className="text-slate-300">/</span>
          <h1 className="truncate text-[17px] font-bold text-[#0F172A]">{project.name}</h1>
          <span className="flex-shrink-0 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">{project.code}</span>
        </div>
        <div className="flex items-center gap-2">
          {(isFreelancer || isClient) && !project.client_id && <DeleteWorkspaceButton projectId={project.id} />}
          {isFreelancer && <NewMilestoneForm projectId={project.id}/>}
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        {/* Mobile: back + title row */}
        <div className="mb-4 flex items-start justify-between gap-2 lg:hidden">
          <div className="min-w-0">
            <Link href="/dashboard/workspaces" className="text-[11.5px] font-medium text-slate-400 hover:text-slate-600">← Workspaces</Link>
            <div className="mt-0.5 flex items-center gap-2">
              <h1 className="truncate text-[17px] font-bold text-[#0F172A]">{project.name}</h1>
              <span className="flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{project.code}</span>
            </div>
          </div>
          {(isFreelancer || isClient) && (
            <div className="flex flex-shrink-0 items-center gap-2 pt-4">
              {!project.client_id && <DeleteWorkspaceButton projectId={project.id} />}
              {isFreelancer && <NewMilestoneForm projectId={project.id}/>}
            </div>
          )}
        </div>

        {inviteLink && <div className="mb-4"><CopyLinkBox link={inviteLink} /></div>}

        {!project.client_id && isFreelancer && !inviteLink && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <span className="text-[13px] text-amber-700 flex-1">No client has joined yet.</span>
            <InviteClientButton projectId={project.id} />
          </div>
        )}

        {!project.client_id && !isFreelancer && (
          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Waiting for the freelancer to send you an invite link.
          </div>
        )}

        {/* Milestones */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
            <h2 className="text-[14px] font-bold text-[#0F172A] sm:text-sm">Milestones</h2>
            {isFreelancer && <div className="lg:hidden"><NewMilestoneForm projectId={project.id}/></div>}
          </div>
          {!milestones?.length ? (
            <p className="px-4 py-5 text-sm text-slate-500">No milestones yet.{isFreelancer && " Click \"Add Milestone\" to create one."}</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {milestones.map((m) => {
                // Format date as "Jun 25" instead of "2026-06-25" to prevent wrapping
                const dueDisplay = m.due_date
                  ? new Date(m.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : null;
                return (
                  <li key={m.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-[#0F172A]">{m.title}</p>
                        <p className="mt-0.5 whitespace-nowrap font-mono text-[11px] text-slate-500 sm:text-[11.5px]">
                          ${Number(m.amount).toLocaleString()}{dueDisplay && <> · {dueDisplay}</>}
                        </p>
                      </div>
                      <StatusPill status={m.status} />
                    </div>
                    <MilestoneActions milestoneId={m.id} projectId={project.id} status={m.status} amount={Number(m.amount)} title={m.title} freelancerId={project.freelancer_id} isFreelancer={isFreelancer} isClient={isClient}/>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Chat */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
            <h2 className="text-[14px] font-bold text-[#0F172A] sm:text-sm">Chat</h2>
          </div>
          <ChatPanel projectId={project.id} currentUserId={user.id} isClient={isClient} initialMessages={messages ?? []}/>
        </div>

        {/* Files */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-[14px] font-bold text-[#0F172A] sm:text-sm">Files</h2>
          <FilesList files={files ?? []} />
        </div>

        {/* Transactions */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
            <h2 className="text-[14px] font-bold text-[#0F172A] sm:text-sm">Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <TransactionsTable transactions={transactions ?? []} />
          </div>
        </div>

        {/* Contract */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-[14px] font-bold text-[#0F172A] sm:text-sm">Scope agreement</h2>
          <ContractPanel
            projectId={project.id} isFreelancer={isFreelancer}
            contract={contract ?? null} signatures={signatures ?? []}
            freelancerId={project.freelancer_id} clientId={project.client_id}
            defaultSignedName={profile?.display_name ?? profile?.email ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
