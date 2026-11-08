"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import type { Category } from "@/lib/talent/categories";
import { CategoryForm } from "./CategoryForm";
import { PencilButton, cardClass } from "./ui";

export function CategoryCard({
  mains, nichesByMain, category, niches, categoryOther,
}: {
  mains: Category[];
  nichesByMain: Record<string, Category[]>;
  category: string | null;
  niches: string[];
  categoryOther: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const label = (slug: string) =>
    mains.find((m) => m.slug === slug)?.label ??
    Object.values(nichesByMain).flat().find((n) => n.slug === slug)?.label ?? slug;

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold text-[#0F172A]">Category and niches</h2>
        <PencilButton onClick={() => setEditing(true)} label="Edit category and niches" />
      </div>
      {category ? (
        <div>
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-slate-400">{label(category)}</p>
          <div className="flex flex-wrap gap-2.5">
            {category === "other" && categoryOther && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[14px] font-medium text-slate-700">{categoryOther}</span>
            )}
            {niches.map((n) => (
              <span key={n} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[14px] font-medium text-slate-700">{label(n)}</span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[15px] text-slate-400">Choose your category so clients can find you when they browse the Talent Space.</p>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Category and niches" wide>
        <CategoryForm mains={mains} nichesByMain={nichesByMain} category={category} niches={niches}
          categoryOther={categoryOther} onSaved={() => setEditing(false)} />
      </Modal>
    </section>
  );
}
