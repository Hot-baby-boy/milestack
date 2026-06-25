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
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!notifications.length && (
              <p className="p-4 text-sm text-slate-500">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read_at && markNotificationRead(n.id)}
                className={`block w-full px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                  n.read_at ? "text-slate-500" : "font-medium text-slate-900"
                }`}
              >
                {describe(n)}
                <div className="mt-0.5 text-xs text-slate-400">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
