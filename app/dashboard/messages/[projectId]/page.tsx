import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MessagesLayout } from "../MessagesLayout";
import { StatusPill } from "@/components/StatusPill";
import { MilestoneActions } from "@/app/dashboard/[projectId]/MilestoneActions";
import { NewMilestoneForm } from "@/app/dashboard/[projectId]/NewMilestoneForm";
import { ContractPanel } from "@/app/dashboard/[projectId]/ContractPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { FilesList } from "@/app/dashboard/[projectId]/FilesList";
import { TransactionsTable } from "@/components/TransactionsTable";

export default async function MessagesProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch conversation list for the left panel
  const { data: projects } = await supabase
    .from("projects")
    .select("id, code, name, client_id, freelancer_id, created_at")
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map(p => p.id);
  const { data: latestMessages } = projectIds.length
    ? await supabase
        .from("chat_messages")
        .select("id, project_id, body, sender_id, created_at")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] as { id: string; project_id: string; body: string; sender_id: string; created_at: string }[] };

  type Preview = { project_id: string; body: string; sender_id: string; created_at: string };
  const previewMap: Record<string, Preview> = {};
  for (const msg of (latestMessages ?? [])) {
    if (!previewMap[msg.project_id]) previewMap[msg.project_id] = msg;
  }

  // Fetch full project workspace data
  const { data: project } = await supabase
    .from("projects")
    .select("id, code, name, freelancer_id, client_id")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  const isFreelancer = user.id === project.freelancer_id;
  const isClient     = user.id === project.client_id;

  const [
    { data: milestones },
    { data: transactions },
    { data: contract },
    { data: messages },
    { data: files },
    { data: profile },
  ] = await Promise.all([
    supabase.from("milestones").select("id, title, amount, due_date, status").eq("project_id", projectId).order("created_at", { ascending: true }),
    supabase.from("transactions").select("id, type, amount, currency, created_at").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("contracts").select("id, content, status").eq("project_id", projectId).maybeSingle(),
    supabase.from("messages").select("id, project_id, sender_id, type, body, attachment_id, created_at").eq("project_id", projectId).order("created_at", { ascending: true }),
    supabase.from("files").select("id, name, size, mime, created_at").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("profiles").select("display_name, email").eq("id", user.id).single(),
  ]);

  const { data: signatures } = contract
    ? await supabase.from("contract_signatures").select("user_id, signed_name, signed_at").eq("contract_id", contract.id)
    : { data: [] };

  return (
    <div style={{height:"100%"}}>
      <MessagesLayout
        projects={projects ?? []}
        previews={Object.values(previewMap)}
        activeProjectId={projectId}
      >
        {/* Right panel — full workspace scrollable */}
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="flex h-[60px] flex-shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 lg:h-[72px] lg:px-6">
            <Link href="/dashboard/messages" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-[#0F172A]">{project.name}</p>
              <p className="font-mono text-[11px] text-slate-400">{project.code}</p>
            </div>
            {isFreelancer && <NewMilestoneForm projectId={project.id}/>}
          </div>

          {/* Scrollable workspace content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-5 space-y-4">

            {/* Milestones */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="text-[14px] font-bold text-[#0F172A]">Milestones</h2>
              </div>
              {!milestones?.length ? (
                <p className="px-4 py-5 text-sm text-slate-500">No milestones yet.{isFreelancer && " Click \"Add Milestone\" to create one."}</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {milestones.map(m => {
                    const dueDisplay = m.due_date
                      ? new Date(m.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : null;
                    return (
                      <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold text-[#0F172A]">{m.title}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                            ${Number(m.amount).toLocaleString()}{dueDisplay && <> · {dueDisplay}</>}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <StatusPill status={m.status}/>
                          <MilestoneActions milestoneId={m.id} projectId={project.id} status={m.status} isFreelancer={isFreelancer} isClient={isClient}/>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Chat */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" style={{minHeight:320}}>
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-[14px] font-bold text-[#0F172A]">Chat</h2>
              </div>
              <ChatPanel projectId={project.id} currentUserId={user.id} isClient={isClient} initialMessages={messages ?? []}/>
            </div>

            {/* Files */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-[14px] font-bold text-[#0F172A]">Files</h2>
              <FilesList files={files ?? []}/>
            </div>

            {/* Transactions */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-[14px] font-bold text-[#0F172A]">Transactions</h2>
              </div>
              <div className="overflow-x-auto">
                <TransactionsTable transactions={transactions ?? []}/>
              </div>
            </div>

            {/* Contract */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-[14px] font-bold text-[#0F172A]">Scope agreement</h2>
              <ContractPanel
                projectId={project.id} isFreelancer={isFreelancer}
                contract={contract ?? null} signatures={signatures ?? []}
                freelancerId={project.freelancer_id} clientId={project.client_id}
                defaultSignedName={profile?.display_name ?? profile?.email ?? ""}
              />
            </div>

          </div>
        </div>
      </MessagesLayout>
    </div>
  );
}
