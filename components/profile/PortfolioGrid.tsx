import Image from "next/image";
import type { PortfolioItemWithFiles } from "@/lib/portfolio/load";

// Read-only portfolio for people viewing a profile: a card per item with a big
// cover image, the title and description, extra images, and files and links.
export function PortfolioGrid({ items }: { items: PortfolioItemWithFiles[] }) {
  if (!items.length) return <p className="text-[15px] text-slate-400">No portfolio items yet.</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const images = item.attachments.filter((a) => a.attachment_type === "image" && a.signedUrl);
        const others = item.attachments.filter((a) => a.attachment_type !== "image" && a.signedUrl);
        const cover = images[0];
        return (
          <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            {cover ? (
              <a href={cover.signedUrl!} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/3] bg-slate-50">
                <Image src={cover.signedUrl!} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 420px" />
              </a>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-slate-50 text-4xl text-slate-300">
                {others.some((a) => a.attachment_type === "doc") ? "📄" : "🖼"}
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-[#0F172A]">{item.title}</h3>
              {item.description && <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">{item.description}</p>}

              {images.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.slice(1).map((img) => (
                    <a key={img.id} href={img.signedUrl!} target="_blank" rel="noopener noreferrer"
                      className="relative block h-14 w-14 overflow-hidden rounded-lg border border-slate-100">
                      <Image src={img.signedUrl!} alt={img.name} fill className="object-cover" sizes="56px" />
                    </a>
                  ))}
                </div>
              )}

              {(others.length > 0 || item.external_url) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {others.map((f) => (
                    <a key={f.id} href={f.signedUrl!} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-emerald-300">
                      {f.attachment_type === "link" ? "🔗" : "📄"} {f.name}
                    </a>
                  ))}
                  {item.external_url && (
                    <a href={item.external_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-emerald-300">
                      🔗 View project
                    </a>
                  )}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
