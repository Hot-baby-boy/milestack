export function Chips({ items, tone = "slate" }: { items: string[]; tone?: "slate" | "emerald" }) {
  if (!items.length) return null;
  const cls = tone === "emerald"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((s) => (
        <span key={s} className={`rounded-full border px-4 py-1.5 text-[14px] font-medium ${cls}`}>{s}</span>
      ))}
    </div>
  );
}

export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
      <h2 className="mb-4 text-[20px] font-bold text-[#0F172A]">{title}</h2>
      {children}
    </section>
  );
}
