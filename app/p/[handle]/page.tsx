import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  const supabase = await createClient();

  // Must be logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/p/${handle}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, bio, skills, hourly_rate, avatar_url, role")
    .eq("handle", handle)
    .single();

  if (!profile) notFound();

  const { data: portfolioItems } = await supabase
    .from("portfolio_items")
    .select("id, title, description, external_url")
    .eq("user_id", profile.id)
    .order("position", { ascending: true });

  const itemIds = (portfolioItems ?? []).map((i) => i.id);
  const { data: allAttachments } = itemIds.length
    ? await supabase
        .from("portfolio_attachments")
        .select("id, portfolio_item_id, attachment_type, name, url, storage_path, mime")
        .in("portfolio_item_id", itemIds)
    : { data: [] as {
        id: string; portfolio_item_id: string; attachment_type: string;
        name: string; url: string | null; storage_path: string | null; mime: string | null;
      }[] };

  // Build signed URLs
  const attachmentsWithUrls = await Promise.all(
    (allAttachments ?? []).map(async (a) => {
      if (a.storage_path) {
        const { data } = await supabase.storage
          .from("portfolio")
          .createSignedUrl(a.storage_path, 3600);
        return { ...a, signedUrl: data?.signedUrl ?? null };
      }
      return { ...a, signedUrl: a.url };
    })
  );

  const itemsWithAttachments = (portfolioItems ?? []).map((item) => ({
    ...item,
    attachments: attachmentsWithUrls.filter((a) => a.portfolio_item_id === item.id),
  }));

  const name = profile.display_name ?? handle;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="mx-auto max-w-2xl px-6 py-8">

        {/* Profile header */}
        <div className="mb-8 flex items-start gap-5">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={name} fill className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl text-slate-400">
                {name[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{name}</h1>
            <p className="text-sm capitalize text-slate-500">{profile.role}</p>
            {profile.hourly_rate && (
              <p className="mt-1 text-sm font-medium text-slateald-700">
                USD {Number(profile.hourly_rate).toLocaleString()}/hr
              </p>
            )}
            {profile.bio && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
            )}
            {(profile.skills ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile.skills as string[]).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio */}
        {itemsWithAttachments.length > 0 && (
          <section>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Portfolio</h2>
            <div className="space-y-4">
              {itemsWithAttachments.map((item) => {
                const images = item.attachments.filter((a) => a.attachment_type === "image");
                const docs = item.attachments.filter((a) => a.attachment_type === "doc");
                const links = item.attachments.filter((a) => a.attachment_type === "link");

                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="font-medium text-slate-900">{item.title}</h3>
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

                    {(docs.length > 0 || links.length > 0 || item.external_url) && (
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
                        {item.external_url && (
                          <a
                            href={item.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-emerald-300"
                          >
                            🔗 View project
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {itemsWithAttachments.length === 0 && profile.role === "freelancer" && (
          <p className="text-sm text-slate-400">No portfolio items yet.</p>
        )}
      </div>
    </div>
  );
}
