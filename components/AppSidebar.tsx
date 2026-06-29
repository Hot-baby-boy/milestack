"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/(auth)/actions";
import { NotificationBell } from "@/components/NotificationBell";

export const LogoMark = () => (
  <svg width="32" height="32" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 8, flexShrink: 0 }}>
    <rect width="1080" height="1080" fill="#101421"/>
    <path fill="#15a756" d="M540.92,621.3c9.45-19.55,18.32-38.14,27.4-56.63q32.82-66.76,65.79-133.45c3.39-6.86,6.6-13.83,10.26-20.55,1.76-3.24,1.38-5.5-.66-8.49-12.1-17.75-14.93-36.79-6.88-57C647,319.8,675.39,305.83,703,312.46c26.1,6.26,44.19,31.73,42.06,58.61A57,57,0,0,1,732,403.84c-2,2.36-2.22,4.23-.84,7q21.63,44.12,43,88.36,22.92,47.4,45.67,94.89c9.73,20.26,19.35,40.58,29.25,60.75.93,1.9,3.33,3.58,5.42,4.34,19.07,6.92,32.54,19.56,38.56,39,9.83,31.69-8.38,67.23-42.91,75.54-31.91,7.68-65.13-15-70.38-48-2.81-17.64,1.09-33.43,12.38-47.2,2.33-2.84,1.18-4.65,0-7.07Q747.22,581,702.39,490.41c-4.76-9.62-9.35-19.31-14.62-30.2-34.72,70.14-68.89,139.15-103.09,208.22,11.55,12.44,17.63,26.86,18.18,43.51a61.73,61.73,0,0,1-59.77,63.51c-36.62,1-65.26-27.35-64.23-64a62.15,62.15,0,0,1,15-38.89c1.87-2.23,2.2-3.94.86-6.6q-50-99.76-99.9-199.61c-.65-1.3-1.45-2.54-2.37-4.12-12.09,24.24-23.93,48.09-35.87,71.88q-34.23,68.26-68.63,136.44c-1.5,3-1.22,4.67.82,7.35,15.17,20,17.9,41.86,6.73,64.25S265.24,775.82,240.38,775c-28.46-1-52-23.13-55.54-50.46-3.81-29.26,12.24-55.48,40-64.87a11.56,11.56,0,0,0,7.45-6.45q54.22-111.3,108.65-222.49c3-6.12,5.8-12.35,9.05-18.33,1.59-2.92,1.37-4.76-.77-7.39-17.22-21.25-18.34-49.53-3-70.83,13.32-18.55,38.07-27.26,60.86-21.43,21.86,5.59,38,24.37,40.82,47.4,2,16-2.16,30.39-11.87,43.12-2,2.64-2.29,4.47-.77,7.49Q475.37,490.3,515.26,570q11.75,23.41,23.38,46.89C539.21,618.06,539.82,619.19,540.92,621.3Zm-.23,119.94c15.88.16,29.1-12.56,29.09-28s-12.87-29-27.66-29.22a28.78,28.78,0,0,0-29.24,28.48C512.71,727.94,525.43,741.09,540.69,741.24Z"/>
  </svg>
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
            label={item.label === "Portfolio" && role === "client" ? "Profile" : item.label}
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
  displayName: string; role: string; initials: string; unreadCount: number; disputeCount: number; notifications: AppNotification[];
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
type AppNotification = { id: string; project_id: string | null; type: string; payload: Record<string, unknown>; read_at: string | null; created_at: string };

export function MobileNav(props: {
  displayName: string; role: string; initials: string; unreadCount: number; disputeCount: number; notifications: AppNotification[];
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
        <div className="flex items-center gap-2">
          <NotificationBell notifications={props.notifications} unreadCount={props.unreadCount + props.disputeCount}/>
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
