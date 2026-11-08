"use client";

import { useActionState, useState } from "react";
import { saveCategory } from "@/lib/talent/actions";
import { MAX_NICHES, type Category } from "@/lib/talent/categories";

const selectClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none";

export type Strength = { points: number; max_points: number; missing: string[] } | null;

export function ProfileStrength({ strength }: { strength: Strength }) {
  if (!strength) return null;
  const pct = Math.round((strength.points / strength.max_points) * 100);
  const bar = pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#0F172A]">Profile strength</h2>
        <span className="text-[13px] font-semibold text-slate-700">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-[13px] text-slate-500">
        {strength.missing.length === 0
          ? "Your profile is complete. Clients see complete profiles first."
          : `Complete profiles and good reviews are shown to clients first. Add: ${strength.missing.join(", ")}.`}
      </p>
    </div>
  );
}

export function CategoryForm({
  mains, nichesByMain, category: initialCategory, niches: initialNiches, categoryOther: initialOther,
}: {
  mains: Category[];
  nichesByMain: Record<string, Category[]>;
  category: string | null;
  niches: string[];
  categoryOther: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveCategory, null);
  const [category, setCategory] = useState(initialCategory ?? "");
  const [niches, setNiches] = useState<string[]>(initialNiches);
  const [other, setOther] = useState(initialOther ?? "");

  const options = category ? nichesByMain[category] ?? [] : [];

  function toggle(slug: string) {
    setNiches((cur) =>
      cur.includes(slug) ? cur.filter((n) => n !== slug) : cur.length >= MAX_NICHES ? cur : [...cur, slug],
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-[15px] font-bold text-[#0F172A]">Category &amp; niches</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Clients browse the Talent Space by category. Pick your main category, then up to {MAX_NICHES} niches.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Main category</label>
          <select name="category" value={category} required
            onChange={(e) => { setCategory(e.target.value); setNiches([]); setOther(""); }}
            className={selectClass}>
            <option value="">Choose your main category</option>
            {mains.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </div>

        {category === "other" && (
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">What do you do?</label>
            <input name="category_other" value={other} onChange={(e) => setOther(e.target.value)}
              maxLength={60} required placeholder="e.g. Podcast production"
              className={selectClass} />
            <p className="mt-1 text-[12px] text-slate-400">Clients will see this description. Up to 60 characters.</p>
          </div>
        )}

        {options.length > 0 && (
          <div>
            <p className="mb-2 text-[13px] font-medium text-slate-700">
              Niches <span className="font-normal text-slate-400">({niches.length}/{MAX_NICHES})</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((n) => {
                const on = niches.includes(n.slug);
                const locked = !on && niches.length >= MAX_NICHES;
                return (
                  <label key={n.slug}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition ${
                      on ? "border-emerald-500 bg-emerald-50 font-medium text-emerald-700"
                         : locked ? "cursor-not-allowed border-slate-200 text-slate-300"
                         : "border-slate-300 text-slate-600 hover:border-emerald-300"}`}>
                    <input type="checkbox" className="sr-only" name="niches" value={n.slug}
                      checked={on} disabled={locked} onChange={() => toggle(n.slug)} />
                    {n.label}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {state && "error" in state && <p className="text-[13px] text-red-600">{state.error}</p>}
        {state && "success" in state && <p className="text-[13px] text-emerald-600">Saved.</p>}

        <button type="submit" disabled={pending}
          className="flex h-[40px] items-center rounded-xl bg-emerald-500 px-5 text-[14px] font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50">
          {pending ? "Saving…" : "Save category"}
        </button>
      </form>
    </div>
  );
}
