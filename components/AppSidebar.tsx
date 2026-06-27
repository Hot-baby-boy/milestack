"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/(auth)/actions";

export const LogoMark = () => (
  <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-slate-800 to-slate-950">
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
      <polyline points="6,22 11,10 16,20 21,8 26,20" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="22" r="1.8" fill="#10B981"/>
      <circle cx="11" cy="10" r="1.8" fill="#10B981"/>
      <circle cx="16" cy="20" r="1.8" fill="#10B981"/>
      <circle cx="21" cy="8" r="1.8" fill="#10B981"/>
      <circle cx="26" cy="20" r="1.8" fill="#10B981"/>
    </svg>
  </span>
);

const NAV = [
  { href: "/dashboard", exact: true, label: "Dashboard",
    icon: <><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></> },
  { href: "/dashboard/workspaces", label: "Workspaces",
    icon: <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/> },
  { href: "/dashboard/milestones", label: "Milestones",
    icon: <><path d="M5 3v18"/><path d="M5 4h11l-3 4 3 4H5"/></> },
  { href: "/dashboard/payments", label: "Payments",
    icon: <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 14h4"/></> },
  { href: "/dashboard/contracts", label: "Contracts",
    icon: <><path d="M14 3v4a1 1 0 001 1h4"/><path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/><path d="M9 13h6M9 17h6"/></> },
  { href: "/dashboard/messages", label: "Messages",
    icon: <><path d="M21 11.5a8.5 8.5 0 11-3.8-7.1"/><path d="M3 21l1.6-4A8.5 8.5 0 0121 11.5"/></> },
  { href: "/dashboard/files", label: "Files",
    icon: <><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></> },
  { href: "/dashboard/profile", label: "Portfolio",
    icon: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></> },
];

const NAV_BOTTOM = [
  { href: "/dashboard/disputes", label: "Disputes",
    icon: <><path d="M12 3v18M5 7l-2 5a3 3 0 006 0L7 7H5zM19 7l-2 5a3 3 0 006 0l-2-5h-2z"/><path d="M5 7h14"/></> },
  { href: "/dashboard/profile", label: "Settings",
    icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h.1a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5h.1a1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v.1a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></> },
];

function NavItem({ href, label, icon, exact, badge, onClick }: {
  href: string; label: string; icon: React.ReactNode; exact?: boolean; badge?: number; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 rounded-[9px] px-3 py-[10px] text-[14px] font-medium transition-all ${
        active ? "bg-emerald-500/[0.16] text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <svg className={`h-[17px] w-[17px] flex-shrink-0 ${active ? "text-emerald-400" : ""}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >{icon}</svg>
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[10px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarContent({ displayName, role, initials, unreadCount, disputeCount, onClose }: {
  displayName: string; role: string; initials: string; unreadCount: number; disputeCount: number; onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Link href="/dashboard" onClick={onClose}
        className="mb-6 flex items-center gap-2.5 px-[10px] pb-6 pt-2 text-[16.5px] font-extrabold tracking-tight text-white"
      >
        <LogoMark/>
        Milestack
      </Link>
      <nav className="flex flex-1 flex-col gap-[2px]">
        {NAV.map(item => (
          <NavItem key={item.href + item.label} {...item}
            badge={item.label === "Messages" ? unreadCount : undefined}
            onClick={onClose}
          />
        ))}
        <div className="mx-1 my-3.5 h-px bg-white/[0.08]"/>
        {NAV_BOTTOM.map(item => (
          <NavItem key={item.href + item.label} {...item}
            badge={item.label === "Disputes" ? disputeCount : undefined}
            onClick={onClose}
          />
        ))}
      </nav>
      <div className="mt-4 flex items-center gap-2.5 rounded-[10px] bg-white/5 p-3">
        <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 font-mono text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-white">{displayName}</div>
          <div className="text-[11px] capitalize text-slate-400">{role}</div>
        </div>
        <form action={logout}>
          <button title="Log out" className="text-slate-500 transition hover:text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Desktop sidebar — uses inline styles for layout, Tailwind only for display toggle */
export function AppSidebar(props: {
  displayName: string; role: string; initials: string; unreadCount: number; disputeCount: number;
}) {
  return (
    <aside
      className="hidden lg:flex"
      style={{
        width: 240,
        flexShrink: 0,
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        padding: "22px 14px",
        background: "linear-gradient(155deg,#16223C 0%,#0F172A 50%,#060A14 100%)",
      }}
    >
      <SidebarContent {...props} />
    </aside>
  );
}

/* ── Mobile top bar + drawer (rendered in layout separately) ────────────────── */
export function MobileNav(props: {
  displayName: string; role: string; initials: string; unreadCount: number; disputeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      {/* Sticky top bar — mobile only. display must be in className so lg:hidden can override it */}
      <div className="flex lg:hidden" style={{position:"sticky",top:0,zIndex:40,height:60,width:"100%",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #E6E9EF",background:"#fff",padding:"0 16px"}}>
        <Link href="/dashboard" className="flex items-center gap-2 text-[16px] font-extrabold text-[#0F172A]">
          <LogoMark/>
          Milestack
        </Link>
        <div className="flex items-center gap-3">
          {(props.unreadCount + props.disputeCount) > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white">
              {props.unreadCount + props.disputeCount}
            </span>
          )}
          <button onClick={() => setOpen(v => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-slate-200 text-slate-600"
            aria-label="Open menu"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Drawer overlay */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={close}/>
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] overflow-y-auto p-[22px_14px] lg:hidden"
            style={{background:"linear-gradient(155deg,#16223C 0%,#0F172A 50%,#060A14 100%)"}}>
            <SidebarContent {...props} onClose={close}/>
          </aside>
        </>
      )}
    </>
  );
}
