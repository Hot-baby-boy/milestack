const STYLES: Record<string, string> = {
  draft: "bg-slate-50 text-slate-400 border border-slate-200",
  funded: "bg-slate-100 text-slate-700",
  in_progress: "bg-orange-50 text-orange-700",
  submitted: "bg-violet-50 text-violet-700",
  approved: "bg-blue-50 text-blue-600",
  released: "bg-emerald-50 text-emerald-700",
  disputed: "bg-red-50 text-red-600",
  cancelled: "bg-slate-50 text-slate-400 border border-slate-200",
};

const LABELS: Record<string, string> = {
  draft: "DRAFT",
  funded: "FUNDED",
  in_progress: "IN PROGRESS",
  submitted: "SUBMITTED",
  approved: "APPROVED",
  released: "RELEASED",
  disputed: "DISPUTED",
  cancelled: "CANCELLED",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
        STYLES[status] ?? STYLES.draft
      }`}
    >
      {LABELS[status] ?? status.toUpperCase()}
    </span>
  );
}
