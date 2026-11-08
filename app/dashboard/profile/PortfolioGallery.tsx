"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/Modal";
import { addPortfolioItem, deletePortfolioItem } from "./actions";
import { PlusButton, SaveButton, cardClass, inputClass } from "./ui";

type Attachment = {
  id: string;
  attachment_type: string;
  name: string;
  signedUrl: string | null;
};

type Item = {
  id: string;
  title: string;
  description: string | null;
  external_url: string | null;
  attachments: Attachment[];
};

export function PortfolioGallery({ items }: { items: Item[] }) {
  const [adding, setAdding] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewing = items.find((i) => i.id === viewId) ?? null;

  const [addState, addAction, addPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await addPortfolioItem(prev, formData);
      if ("success" in result) setAdding(false);
      return result;
    },
    null,
  );

  return (
    <section className={cardClass}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold text-[#0F172A]">Portfolio</h2>
        <PlusButton onClick={() => setAdding(true)}>Add new</PlusButton>
      </div>

      {items.length === 0 ? (
        <button type="button" onClick={() => setAdding(true)}
          className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-slate-200 px-6 py-10 text-center transition hover:border-emerald-300">
          <span className="text-[15px] font-semibold text-slate-700">Show clients your best work</span>
          <span className="text-[13.5px] text-slate-400">Add images, PDFs or links. Clients see this before they contact you.</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const cover = item.attachments.find((a) => a.attachment_type === "image" && a.signedUrl);
            return (
              <button key={item.id} type="button" onClick={() => setViewId(item.id)}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left transition hover:border-emerald-300">
                {cover?.signedUrl ? (
                  <Image src={cover.signedUrl} alt={item.title} fill className="object-cover transition group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, 240px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl text-slate-300">
                    {item.attachments.some((a) => a.attachment_type === "doc") ? "📄" : item.attachments.some((a) => a.attachment_type === "link") ? "🔗" : "🖼"}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-slate-900/70 to-transparent px-3 pb-2 pt-6 text-[13px] font-semibold text-white">
                  {item.title}
                </span>
              </button>
            );
          })}
          <button type="button" onClick={() => setAdding(true)}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-emerald-300 hover:text-emerald-600">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span className="text-[13px] font-medium">Add new</span>
          </button>
        </div>
      )}

      {/* Add */}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add a portfolio item" wide>
        <form action={addAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Title *</label>
            <input name="title" required className={inputClass} placeholder="Brand identity redesign" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Description</label>
            <textarea name="description" rows={3} className={inputClass} placeholder="A short description of the work…" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
              Images or documents <span className="font-normal text-slate-400">(optional, max 10 MB each)</span>
            </label>
            <input name="attachment_files" type="file" multiple accept="image/*,application/pdf,.doc,.docx"
              className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Link name</label>
              <input name="link_name" className={inputClass} placeholder="Live project" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Link URL</label>
              <input name="link_url" type="url" className={inputClass} placeholder="https://…" />
            </div>
          </div>
          {addState && "error" in addState && <p className="text-[13px] text-red-600">{addState.error}</p>}
          <SaveButton pending={addPending}>Add item</SaveButton>
        </form>
      </Modal>

      {/* View */}
      <Modal open={!!viewing} onClose={() => setViewId(null)} title={viewing?.title ?? ""} wide>
        {viewing && (
          <div className="space-y-4">
            {viewing.description && <p className="text-[14.5px] leading-relaxed text-slate-600">{viewing.description}</p>}
            {viewing.attachments.some((a) => a.attachment_type === "image" && a.signedUrl) && (
              <div className="grid grid-cols-2 gap-2">
                {viewing.attachments.filter((a) => a.attachment_type === "image" && a.signedUrl).map((img) => (
                  <a key={img.id} href={img.signedUrl!} target="_blank" rel="noopener noreferrer"
                    className="relative block aspect-[4/3] overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                    <Image src={img.signedUrl!} alt={img.name} fill className="object-cover" sizes="320px" />
                  </a>
                ))}
              </div>
            )}
            {(viewing.attachments.some((a) => a.attachment_type !== "image" && a.signedUrl) || viewing.external_url) && (
              <div className="flex flex-wrap gap-2">
                {viewing.attachments.filter((a) => a.attachment_type !== "image" && a.signedUrl).map((f) => (
                  <a key={f.id} href={f.signedUrl!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] text-slate-600 hover:border-emerald-300">
                    {f.attachment_type === "link" ? "🔗" : "📄"} {f.name}
                  </a>
                ))}
                {viewing.external_url && (
                  <a href={viewing.external_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] text-slate-600 hover:border-emerald-300">
                    🔗 View project
                  </a>
                )}
              </div>
            )}
            <form action={async (fd: FormData) => { await deletePortfolioItem(fd); setViewId(null); }}
              onSubmit={(e) => { if (!confirm("Delete this portfolio item?")) e.preventDefault(); }}
              className="border-t border-slate-100 pt-4">
              <input type="hidden" name="item_id" value={viewing.id} />
              <button type="submit" className="text-[13px] font-medium text-red-600 hover:underline">Delete this item</button>
            </form>
          </div>
        )}
      </Modal>
    </section>
  );
}
