"use client";

export const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none";

export const cardClass = "rounded-2xl border border-slate-200 bg-white p-6 sm:p-7";

export function PencilButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    </button>
  );
}

export function PlusButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
      {children}
    </button>
  );
}

export function SaveButton({ pending, children = "Save" }: { pending: boolean; children?: React.ReactNode }) {
  return (
    <button type="submit" disabled={pending}
      className="flex h-[42px] items-center rounded-xl bg-emerald-500 px-6 text-[14px] font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50">
      {pending ? "Saving…" : children}
    </button>
  );
}
