import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MessagesLayout } from "./MessagesLayout";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  return (
    <div style={{height:"100%"}}>
      <MessagesLayout
        projects={projects ?? []}
        previews={Object.values(previewMap)}
        activeProjectId={undefined}
      >
        {/* Placeholder shown on desktop when no conversation selected */}
        <div className="hidden h-full flex-col items-center justify-center gap-3 text-center px-6 lg:flex">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>
          </div>
          <p className="text-[14px] font-semibold text-slate-400">Select a conversation</p>
          <p className="text-[12px] text-slate-300">Choose from the list on the left</p>
        </div>
      </MessagesLayout>
    </div>
  );
}
