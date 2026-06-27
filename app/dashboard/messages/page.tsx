import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const AVATAR_COLORS = [
  "from-orange-500 to-amber-400","from-blue-600 to-blue-400","from-emerald-600 to-emerald-400",
  "from-purple-600 to-purple-400","from-red-600 to-rose-400","from-cyan-600 to-cyan-400",
];

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, code, name, client_id, freelancer_id, created_at")
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map(p => p.id);

  // Fetch latest message per project
  const { data: latestMessages } = projectIds.length
    ? await supabase
        .from("chat_messages")
        .select("id, project_id, body, sender_id, created_at")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] as { id: string; project_id: string; body: string; sender_id: string; created_at: string }[] };

  type MsgRow = { id: string; project_id: string; body: string; sender_id: string; created_at: string };
  const latestByProject: Record<string, MsgRow> = {};
  for (const msg of (latestMessages ?? [])) {
    if (!latestByProject[msg.project_id]) latestByProject[msg.project_id] = msg;
  }

  return (
    <div>
      <div className="sticky top-0 z-30 hidden h-[72px] items-center border-b border-slate-200 bg-white px-8 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Messages</h1>
      </div>

      <div className="px-4 py-5 sm:px-8 sm:py-8">
        <h2 className="mb-1 text-[18px] font-bold text-[#0F172A] lg:hidden">Messages</h2>
        <p className="mb-4 text-[13px] text-slate-500 sm:mb-6 sm:text-[13.5px]">Chat from every workspace in one place.</p>

        {!(projects?.length) ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.5 8.5 0 11-3.8-7.1"/><path strokeLinecap="round" strokeLinejoin="round" d="M3 21l1.6-4A8.5 8.5 0 0121 11.5"/></svg>
            </div>
            <h3 className="mb-1 text-[15px] font-bold text-[#0F172A]">No conversations yet</h3>
            <p className="text-sm text-slate-500">Chat is inside each workspace.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" style={{background:"linear-gradient(165deg,#fff 0%,#FAFBFD 100%)"}}>
            <div className="divide-y divide-slate-50">
              {(projects ?? []).map(project => {
                const color = AVATAR_COLORS[project.name.charCodeAt(0) % AVATAR_COLORS.length];
                const inits = project.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                const last = latestByProject[project.id];
                const preview = last?.body ? (last.body.length > 60 ? last.body.slice(0, 60) + "…" : last.body) : "No messages yet";

                return (
                  <Link key={project.id} href={`/dashboard/${project.id}`}
                    className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50"
                  >
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} font-mono text-sm font-bold text-white`}>
                      {inits}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-[14.5px] font-semibold text-[#0F172A]">{project.name}</h5>
                        <span className="font-mono text-[11px] text-slate-400">{project.code}</span>
                      </div>
                      <p className="truncate text-[12.5px] text-slate-500">{preview}</p>
                    </div>
                    {last?.created_at && (
                      <span className="flex-shrink-0 font-mono text-[11.5px] text-slate-400">
                        {new Date(last.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                    <svg className="h-4 w-4 flex-shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
