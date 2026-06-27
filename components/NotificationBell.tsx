"use client";

import { useState } from "react";
import { markNotificationRead } from "@/lib/notifications/actions";

type Notification = {
  id: string;
  project_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

function describe(n: Notification): string {
  switch (n.type) {
    case "new_message":
      return "New message";
    case "milestone_requested":
      return "A milestone was requested";
    case "contract_signed":
      return "Scope agreement fully signed";
    default:
      if (n.type.startsWith("milestone_")) {
        const title = typeof n.payload.title === "string" ? n.payload.title : "A milestone";
        return `${title}: ${n.type.replace("milestone_", "")}`;
      }
      return "Update";
  }
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition ${
          unreadCount > 0
            ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
            : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
        aria-label="Notifications"
      >
        <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)}/>
          {/* Panel — full width on mobile, fixed width on desktop */}
          <div className="fixed left-3 right-3 top-[72px] z-30 rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-[14px] font-semibold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">{unreadCount} new</span>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {!notifications.length && (
                <p className="px-4 py-6 text-center text-[13px] text-slate-400">No notifications yet.</p>
              )}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.read_at) markNotificationRead(n.id); setOpen(false); }}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 ${
                    n.read_at ? "opacity-60" : ""
                  }`}
                >
                  <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${n.read_at ? "bg-slate-200" : "bg-emerald-500"}`}/>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] ${n.read_at ? "text-slate-500" : "font-medium text-slate-900"}`}>{describe(n)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
