export type ReviewItem = { id: string; rating: number; body: string | null; created_at: string; name?: string };

function Stars({ n, size = "h-3.5 w-3.5" }: { n: number; size?: string }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`${size} ${n >= i ? "text-amber-400" : "text-slate-200"}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsList({ reviews }: { reviews: ReviewItem[] }) {
  if (!reviews.length) return null;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {r.name && (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-700">
                    {r.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-[13px] font-semibold text-slate-800">{r.name}</span>
                </>
              )}
              {!r.name && <Stars n={r.rating} />}
            </div>
            <span className="text-[11px] text-slate-400">
              {new Date(r.created_at).toLocaleDateString([], { month: "short", year: "numeric" })}
            </span>
          </div>
          {r.name && <div className="mb-2"><Stars n={r.rating} /></div>}
          {r.body && <p className="text-[13.5px] leading-relaxed text-slate-600">{r.body}</p>}
        </div>
      ))}
    </div>
  );
}
