import Link from "next/link";
import type { Category } from "@/lib/talent/categories";

// Category cards shown at the top of the Talent page. Each card links to
// that category's results.
export function CategoryGrid({
  mains, counts, nichesByMain,
}: {
  mains: Category[];
  counts: Record<string, number>;
  nichesByMain: Record<string, Category[]>;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {mains.map((c) => {
        const n = counts[c.slug] ?? 0;
        return (
          <Link key={c.slug} href={`/dashboard/talent?category=${c.slug}`}
            className="flex flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-[#0F172A]">{c.label}</h3>
              <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] font-medium text-slate-600">
                {n} listed
              </span>
            </div>
            <p className="line-clamp-2 text-[12.5px] leading-relaxed text-slate-500">
              {(nichesByMain[c.slug] ?? []).slice(0, 4).map((x) => x.label).join(" · ")}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
