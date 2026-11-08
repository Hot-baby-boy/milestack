"use client";

import { useState } from "react";

// Work / Reviews tabs for the right-hand column of a profile.
export function ProfileTabs({
  work, reviews, workCount, reviewCount,
}: {
  work: React.ReactNode;
  reviews: React.ReactNode;
  workCount: number;
  reviewCount: number;
}) {
  const [tab, setTab] = useState<"work" | "reviews">("work");
  const tabs = [
    { id: "work" as const, label: "Work", count: workCount },
    { id: "reviews" as const, label: "Reviews", count: reviewCount },
  ];

  return (
    <div>
      <div role="tablist" className="mb-6 flex gap-7 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 pb-3 text-[15.5px] font-semibold transition ${
              tab === t.id ? "border-[#0F172A] text-[#0F172A]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t.label}{t.count > 0 && <span className="ml-1.5 text-[13px] font-medium text-slate-400">{t.count}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tab === "work" ? work : reviews}</div>
    </div>
  );
}
