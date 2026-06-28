import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MessagesLayout } from "../MessagesLayout";
import { ChatPanel } from "@/components/ChatPanel";

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
        .from("messages")
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

  // Fetch this project + its messages
  const { data: project } = await supabase
    .from("projects")
    .select("id, code, name, freelancer_id, client_id")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  const isClient = user.id === project.client_id;

  const { data: messages } = await supabase
    .from("messages")
    .select("id, project_id, sender_id, type, body, attachment_id, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  // Fetch the "other" person's profile for left panel and chat header
  const otherIds = [...new Set(
    (projects ?? []).map(p => p.freelancer_id === user.id ? p.client_id : p.freelancer_id).filter(Boolean)
  )];
  const { data: otherProfiles } = otherIds.length
    ? await supabase.from("profiles").select("id, display_name, email, handle").in("id", otherIds)
    : { data: [] as { id: string; display_name: string | null; email: string; handle: string | null }[] };
  const profileMap = Object.fromEntries((otherProfiles ?? []).map(p => [p.id, p]));

  const otherId = user.id === project.client_id ? project.freelancer_id : project.client_id;
  const otherProfile = profileMap[otherId];
  const otherName = otherProfile?.display_name ?? otherProfile?.email ?? project.name;

  return (
    <div style={{height:"100%"}}>
      <MessagesLayout
        projects={projects ?? []}
        previews={Object.values(previewMap)}
        activeProjectId={projectId}
        currentUserId={user.id}
        profileMap={profileMap}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex h-[60px] flex-shrink-0 items-center gap-3 border-b border-slate-100 bg-white pl-4 pr-4 lg:h-[72px] lg:pl-6 lg:pr-20">
            <Link href="/dashboard/messages"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </Link>
            <div className="min-w-0 flex-1">
              {otherProfile?.handle ? (
                <Link href={`/p/${otherProfile.handle}`}
                  className="truncate text-[15px] font-bold text-[#0F172A] hover:text-emerald-600 transition"
                >{otherName}</Link>
              ) : (
                <p className="truncate text-[15px] font-bold text-[#0F172A]">{otherName}</p>
              )}
              <p className="font-mono text-[11px] text-slate-400">{project.name} · {project.code}</p>
            </div>

            {/* Call buttons */}
            <div className="flex flex-shrink-0 items-center gap-1">
              {/* Voice call */}
              <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.08 1.18 2 2 0 012 .01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
                </svg>
              </button>
              {/* Video call */}
              <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </button>
            </div>

            {/* Link to full workspace */}
            <Link href={`/dashboard/${project.id}`}
              className="hidden flex-shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition sm:inline-flex"
            >
              Open workspace →
            </Link>
          </div>

          {/* Chat panel fills remaining height */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <ChatPanel
              projectId={project.id}
              currentUserId={user.id}
              isClient={isClient}
              initialMessages={messages ?? []}
            />
          </div>
        </div>
      </MessagesLayout>
    </div>
  );
}
