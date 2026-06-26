"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/(auth)/actions";

const LogoMark = () => (
  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-slate-700 to-slate-900 flex-shrink-0">
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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", exact: true, icon: <><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></> },
  { href: "/dashboard", label: "Workspaces", exact: true, icon: <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/> },
  { href: "/dashboard/profile", label: "Portfolio", icon: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></> },
];

const BOTTOM_ITEMS = [
  { href: "/dashboard/profile", label: "Profile & Settings", icon: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></> },
];

export function AppSidebar({
  displayName,
  role,
  initials,
  unreadCount,
}: {
  displayName: string;
  role: string;
  initials: string;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const NavLink = ({ href, label, icon, exact }: { href: string; label: string; icon: React.ReactNode; exact?: boolean }) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive(href, exact)
          ? "bg-emerald-500/16 text-white [&>svg]:text-emerald-400"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <svg className="h-[17px] w-[17px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
      {label}
    </Link>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" className="mb-7 flex items-center gap-2.5 px-2 py-1 text-base font-extrabold text-white">
        <LogoMark/>
        Milestack
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map(item => <NavLink key={item.label} {...item}/>)}
        <div className="my-3 h-px bg-white/8"/>
        {BOTTOM_ITEMS.map(item => <NavLink key={item.label} {...item}/>)}
      </nav>
      <div className="mt-3 flex items-center gap-2.5 rounded-[10px] bg-white/5 p-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 font-mono text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{displayName}</div>
          <div className="font-mono text-[11px] capitalize text-slate-400">{role}</div>
        </div>
        <form action={logout}>
          <button title="Log out" className="text-slate-500 hover:text-white transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[240px] flex-shrink-0 bg-slate-900 p-3.5 lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-base font-extrabold text-slate-900">
          <LogoMark/>
          Milestack
        </Link>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white">{unreadCount}</span>
          )}
          <button onClick={() => setOpen(!open)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)}/>
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] bg-slate-900 p-3.5 lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
