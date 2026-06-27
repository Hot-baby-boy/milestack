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

  return (
    <div style={{height:"100%"}}>
    <MessagesLayout
      projects={projects ?? []}
      previews={Object.values(previewMap)}
      currentUserId={user.id}
    />
    </div>
  );
}
