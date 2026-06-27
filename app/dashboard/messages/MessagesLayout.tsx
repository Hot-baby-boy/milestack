"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const AVATAR_COLORS = [
  "from-orange-500 to-amber-400","from-blue-600 to-blue-400","from-emerald-600 to-emerald-400",
  "from-purple-600 to-purple-400","from-red-600 to-rose-400","from-cyan-600 to-cyan-400",
];

type Project = {
  id: string; code: string; name: string;
  client_id: string; freelancer_id: string; created_at: string;
};
type Preview = {
  project_id: string; body: string; sender_id: string; created_at: string;
};

function avatar(name: string) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const inits = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return { color, inits };
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessagesLayout({
  projects, previews, activeProjectId, children,
}: {
  projects: Project[];
  previews: Preview[];
  activeProjectId?: string;
  children: React.ReactNode;
}) {
  const [livePreview, setLivePreview] = useState<Record<string, Preview>>(() => {
    const map: Record<string, Preview> = {};
    for (const p of previews) map[p.project_id] = p;
    return map;
  });

  useEffect(() => {
    if (!projects.length) return;
    const supabase = createClient();
    const projectIds = projects.map(p => p.id);
    const channel = supabase
      .channel("messages-list-preview")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as { project_id: string; body: string; sender_id: string; created_at: string };
        if (projectIds.includes(msg.project_id)) {
          setLivePreview(prev => ({ ...prev, [msg.project_id]: msg }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projects]);

  const hasActive = !!activeProjectId;

  return (
    <div className="flex overflow-hidden" style={{height:"100%"}}>

      {/* LEFT — conversation list */}
      <div className={`flex flex-col border-r border-slate-100 bg-white ${
        hasActive ? "hidden lg:flex" : "flex"
      } w-full lg:w-[300px] xl:w-[340px] flex-shrink-0`}>
        <div className="flex h-[60px] flex-shrink-0 items-center border-b border-slate-100 px-5 lg:h-[72px]">
          <h1 className="text-[16px] font-bold text-[#0F172A] lg:text-[19px]">Messages</h1>
        </div>

        {!projects.length ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>
            </div>
            <p className="text-[13px] font-semibold text-slate-600">No conversations yet</p>
            <p className="mt-1 text-[12px] text-slate-400">Chat lives inside each workspace.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {projects.map(project => {
              const { color, inits } = avatar(project.name);
              const last = livePreview[project.id];
              const preview = last?.body
                ? (last.body.length > 55 ? last.body.slice(0, 55) + "…" : last.body)
                : "No messages yet";
              const isActive = activeProjectId === project.id;

              return (
                <Link key={project.id}
                  href={`/dashboard/messages/${project.id}`}
                  className={`flex w-full items-center gap-3 px-5 py-3.5 transition ${
                    isActive
                      ? "border-r-2 border-emerald-500 bg-emerald-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} font-mono text-[13px] font-bold text-white`}>
                    {inits}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-[13.5px] font-semibold text-[#0F172A]">{project.name}</span>
                      {last?.created_at && (
                        <span className="flex-shrink-0 text-[11px] text-slate-400">{timeLabel(last.created_at)}</span>
                      )}
                    </div>
                    <p className={`truncate text-[12px] ${isActive ? "text-emerald-700" : "text-slate-500"}`}>{preview}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — project workspace or placeholder */}
      <div className={`flex-1 flex-col overflow-hidden ${hasActive ? "flex" : "hidden lg:flex"}`}>
        {children}
      </div>
    </div>
  );
}
