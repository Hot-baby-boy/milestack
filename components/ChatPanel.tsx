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
        <div className="flex items-center gap-2 border-t border-slate-100 p-4">
          {isClient && (
            <button
              onClick={() => setRequesting(true)}
              title="Request a milestone"
              className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              +
            </button>
          )}
          <label className="cursor-pointer rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50">
            📎
            <input type="file" className="hidden" onChange={onFileChange} />
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Type a message…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={onSend}
            disabled={pending}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      )}

      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
