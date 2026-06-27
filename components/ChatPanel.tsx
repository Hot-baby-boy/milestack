"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, requestMilestone } from "@/lib/messages/actions";
import { attachFile } from "@/lib/files/actions";

type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  type: "text" | "milestone_request" | "milestone_event";
  body: string;
  attachment_id: string | null;
  created_at: string;
};

export function ChatPanel({
  projectId,
  currentUserId,
  isClient,
  initialMessages,
}: {
  projectId: string;
  currentUserId: string;
  isClient: boolean;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [reqTitle, setReqTitle] = useState("");
  const [reqAmount, setReqAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function onSend() {
    if (!text.trim()) return;
    setPending(true);
    setError(null);
    const result = await sendMessage(projectId, text);
    setPending(false);
    if (result?.error) setError(result.error);
    else setText("");
  }

  async function onRequestMilestone() {
    setPending(true);
    setError(null);
    const result = await requestMilestone(projectId, reqTitle, Number(reqAmount));
    setPending(false);
    if (result?.error) setError(result.error);
    else {
      setRequesting(false);
      setReqTitle("");
      setReqAmount("");
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPending(true);
    setError(null);
    const supabase = createClient();
    const storagePath = `${projectId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("deliverables")
      .upload(storagePath, file);

    if (uploadError) {
      setPending(false);
      setError(uploadError.message);
      return;
    }

    const attached = await attachFile(projectId, storagePath, file.name, file.size, file.type);
    if ("error" in attached) {
      setPending(false);
      setError(attached.error);
      return;
    }

    const result = await sendMessage(projectId, `Attached: ${file.name}`, attached.fileId);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {!messages.length && <p className="text-sm text-slate-500">No messages yet.</p>}
        {messages.map((m) => {
          const isMine = m.sender_id === currentUserId;
          if (m.type === "milestone_event") {
            return (
              <p key={m.id} className="text-center text-xs text-slate-400">
                {m.body}
              </p>
            );
          }
          if (m.type === "milestone_request") {
            return (
              <div
                key={m.id}
                className="mx-auto max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              >
                {m.body}
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                  isMine ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {requesting ? (
        <div className="border-t border-slate-100 p-4">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={reqTitle}
              onChange={(e) => setReqTitle(e.target.value)}
              placeholder="Milestone title"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <input
              value={reqAmount}
              onChange={(e) => setReqAmount(e.target.value)}
              type="number"
              step="0.01"
              placeholder="Amount (USD)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={onRequestMilestone}
              disabled={pending}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send request"}
            </button>
            <button
              onClick={() => setRequesting(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-slate-100 p-3">
          {isClient && (
            <button
              onClick={() => setRequesting(true)}
              title="Request a milestone"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          )}
          {/* File attachment */}
          <label className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
            <input type="file" className="hidden" onChange={onFileChange} />
          </label>
          {/* Voice note */}
          <button
            type="button"
            title="Voice note"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
            </svg>
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={onSend}
            disabled={pending}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      )}

      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
