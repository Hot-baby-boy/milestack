"use client";

import { useEffect, useRef } from "react";

// A simple pop-up: dark overlay, centred card (a bottom sheet on phones).
// Closes on Escape, on clicking the overlay, and with the X button.
export function Modal({
  open, onClose, title, children, wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
      >
        <div className="flex items-center justify-between px-6 pb-3 pt-5">
          <h2 className="text-[17px] font-bold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
