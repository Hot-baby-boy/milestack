// Server component: shows how complete the profile is and what to add next.
export type Strength = { points: number; max_points: number; missing: string[] } | null;

export function StrengthCard({ strength }: { strength: Strength }) {
  if (!strength) return null;
  const pct = Math.round((strength.points / strength.max_points) * 100);
  const bar = pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-rose-400";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[18px] font-bold text-[#0F172A]">Profile strength</h2>
        <span className="text-[22px] font-bold text-[#0F172A]">{pct}%</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed text-slate-500">
        {strength.missing.length === 0
          ? "Your profile is complete. Clients see complete profiles first."
          : "Complete profiles and good reviews are shown to clients first."}
      </p>
      {strength.missing.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {strength.missing.slice(0, 6).map((m) => (
            <li key={m} className="flex items-start gap-2 text-[13.5px] text-slate-600">
              <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
              Add {m}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
