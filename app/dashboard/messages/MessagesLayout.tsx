"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatPanel } from "@/components/ChatPanel";

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
type Message = {
  id: string; project_id: string; sender_id: string;
  type: "text" | "milestone_request" | "milestone_event";
  body: string; attachment_id: string | null; created_at: string;
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

function ChatView({
  project, currentUserId, onBack,
}: {
  project: Project; currentUserId: string; onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    setMessages(null);
    const supabase = createClient();
    supabase
      .from("chat_messages")
      .select("id, project_id, sender_id, type, body, attachment_id, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) ?? []));
  }, [project.id]);

  const { color, inits } = avatar(project.name);
  const isClient = project.client_id === currentUserId;

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex h-[64px] flex-shrink-0 items-center gap-3 border-b border-slate-100 px-4">
        {/* Back button — mobile only */}
        <button onClick={onBack} className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 lg:hidden">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} font-mono text-[13px] font-bold text-white`}>
          {inits}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#0F172A]">{project.name}</p>
          <p className="font-mono text-[11px] text-slate-400">{project.code}</p>
        </div>
      </div>

      {/* Chat body */}
      {messages === null ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"/>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatPanel
            projectId={project.id}
            currentUserId={currentUserId}
            isClient={isClient}
            initialMessages={messages}
          />
        </div>
      )}
    </div>
  );
}

export function MessagesLayout({
  projects, previews, currentUserId,
}: {
  projects: Project[];
  previews: Preview[];
  currentUserId: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // live previews — updated by realtime
  const [livePreview, setLivePreview] = useState<Record<string, Preview>>(() => {
    const map: Record<string, Preview> = {};
    for (const p of previews) map[p.project_id] = p;
    return map;
  });

  // Subscribe to all project chats for live preview updates in the list
  useEffect(() => {
    if (!projects.length) return;
    const supabase = createClient();
    const projectIds = projects.map(p => p.id);
    const channel = supabase
      .channel("messages-list-preview")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        // filter by any project — realtime will give us new messages
      }, (payload) => {
        const msg = payload.new as { project_id: string; body: string; sender_id: string; created_at: string };
        if (projectIds.includes(msg.project_id)) {
          setLivePreview(prev => ({ ...prev, [msg.project_id]: msg }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projects]);

  const selectedProject = projects.find(p => p.id === selectedId) ?? null;

  // On mobile: show list OR chat, not both
  // On desktop: show both side by side

  return (
    <div className="flex overflow-hidden" style={{height:"100%"}}>

      {/* LEFT — conversation list */}
      <div className={`flex flex-col border-r border-slate-100 bg-white ${
        selectedId ? "hidden lg:flex" : "flex"
      } w-full lg:w-[300px] xl:w-[340px] flex-shrink-0`}>
        {/* Top bar — shows on mobile (no sidebar top bar), hidden on desktop where sidebar shows page title */}
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
              const isActive = selectedId === project.id;

              return (
                <button key={project.id} onClick={() => setSelectedId(project.id)}
                  className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition ${
                    isActive ? "bg-emerald-50 border-r-2 border-emerald-500" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} font-mono text-[13px] font-bold text-white`}>
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
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — chat panel */}
      <div className={`flex-1 flex-col overflow-hidden ${
        selectedId ? "flex" : "hidden lg:flex"
      }`}>
        {selectedProject ? (
          <ChatView
            key={selectedProject.id}
            project={selectedProject}
            currentUserId={currentUserId}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>
            </div>
            <p className="text-[14px] font-semibold text-slate-400">Select a conversation</p>
            <p className="text-[12px] text-slate-300">Choose from the list on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}
