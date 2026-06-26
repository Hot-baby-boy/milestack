"use client";

import { useActionState } from "react";
import Image from "next/image";
import { addPortfolioItem, deletePortfolioItem } from "./actions";

type Attachment = {
  id: string;
  attachment_type: string;
  name: string;
  signedUrl: string | null;
  mime: string | null;
};

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  external_url: string | null;
  attachments: Attachment[];
};

export function PortfolioSection({ items }: { items: PortfolioItem[] }) {
  const [addState, addAction, addPending] = useActionState(addPortfolioItem, null);

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Portfolio</h2>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="mb-6 space-y-4">
          {items.map((item) => (
            <PortfolioCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Add item form */}
      <details className="rounded-xl border border-dashed border-slate-300 bg-white">
        <summary className="cursor-pointer select-none px-5 py-4 text-sm font-medium text-emerald-600 hover:text-emerald-700">
          + Add portfolio item
        </summary>
        <form action={addAction} className="space-y-4 px-5 pb-5 pt-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <input
              name="title"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              placeholder="Brand identity redesign"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              name="description"
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              placeholder="Brief description of the work…"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Images or documents <span className="text-slate-400">(optional, max 10 MB each)</span>
            </label>
            <input
              name="attachment_files"
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx"
              className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Link name</label>
              <input
                name="link_name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                placeholder="Live project"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Link URL</label>
              <input
                name="link_url"
                type="url"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                placeholder="https://…"
              />
            </div>
          </div>

          {addState && "error" in addState && (
            <p className="text-sm text-red-500">{addState.error}</p>
          )}

          <button
            type="submit"
            disabled={addPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {addPending ? "Adding…" : "Add item"}
          </button>
        </form>
      </details>
    </div>
  );
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const images = item.attachments.filter((a) => a.attachment_type === "image");
  const docs = item.attachments.filter((a) => a.attachment_type === "doc");
  const links = item.attachments.filter((a) => a.attachment_type === "link");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-900">{item.title}</h3>
        <DeleteButton itemId={item.id} />
      </div>
      {item.description && (
        <p className="mt-1 text-sm text-slate-500">{item.description}</p>
      )}

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((img) =>
            img.signedUrl ? (
              <a key={img.id} href={img.signedUrl} target="_blank" rel="noopener noreferrer">
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-100">
                  <Image src={img.signedUrl} alt={img.name} fill className="object-cover" />
                </div>
              </a>
            ) : null
          )}
        </div>
      )}

      {(docs.length > 0 || links.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {docs.map((doc) =>
            doc.signedUrl ? (
              <a
                key={doc.id}
                href={doc.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-emerald-300"
              >
                📄 {doc.name}
              </a>
            ) : null
          )}
          {links.map((link) =>
            link.signedUrl ? (
              <a
                key={link.id}
                href={link.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-emerald-300"
              >
                🔗 {link.name}
              </a>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

function DeleteButton({ itemId }: { itemId: string }) {
  return (
    <form action={deletePortfolioItem}>
      <input type="hidden" name="item_id" value={itemId} />
      <button
        type="submit"
        className="text-xs text-slate-400 hover:text-red-500"
        onClick={(e) => {
          if (!confirm("Delete this portfolio item?")) e.preventDefault();
        }}
      >
        Delete
      </button>
    </form>
  );
}
