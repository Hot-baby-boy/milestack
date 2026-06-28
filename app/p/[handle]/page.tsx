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

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, body, created_at, reviewer_id")
    .eq("freelancer_id", profile.id)
    .order("created_at", { ascending: false });

  const reviewerIds = [...new Set((reviews ?? []).map(r => r.reviewer_id))];
  const { data: reviewerProfiles } = reviewerIds.length
    ? await supabase.from("profiles").select("id, display_name, email").in("id", reviewerIds)
    : { data: [] as { id: string; display_name: string | null; email: string }[] };

  const reviewerMap = Object.fromEntries((reviewerProfiles ?? []).map(p => [p.id, p]));

  const avgRating = (reviews ?? []).length
    ? (reviews!.reduce((s, r) => s + r.rating, 0) / reviews!.length)
    : null;

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
            {/* Star rating summary */}
            {avgRating !== null && (
              <div className="mt-1 flex items-center gap-1.5">
                <div className="flex">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} className={`h-4 w-4 ${avgRating >= n ? "text-amber-400" : avgRating >= n - 0.5 ? "text-amber-300" : "text-slate-200"}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-[13px] font-semibold text-slate-700">{avgRating.toFixed(1)}</span>
                <span className="text-[12px] text-slate-400">({reviews!.length} review{reviews!.length !== 1 ? "s" : ""})</span>
              </div>
            )}
            {profile.hourly_rate && (
              <p className="mt-1 text-sm font-medium text-slate-700">
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

        {/* Reviews */}
        {(reviews ?? []).length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Client Reviews</h2>
            <div className="space-y-3">
              {(reviews ?? []).map(r => {
                const rp = reviewerMap[r.reviewer_id];
                const fullName = rp?.display_name ?? rp?.email ?? "Client";
                const parts = fullName.split(" ");
                const displayName = parts.length > 1
                  ? `${parts[0]} ${parts[parts.length - 1][0]}.`
                  : parts[0];
                const date = new Date(r.created_at).toLocaleDateString([], { month: "short", year: "numeric" });
                return (
                  <div key={r.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-700">
                          {displayName[0].toUpperCase()}
                        </div>
                        <span className="text-[13px] font-semibold text-slate-800">{displayName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{date}</span>
                    </div>
                    <div className="mb-2 flex">
                      {[1,2,3,4,5].map(n => (
                        <svg key={n} className={`h-3.5 w-3.5 ${r.rating >= n ? "text-amber-400" : "text-slate-200"}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    {r.body && <p className="text-[13px] leading-relaxed text-slate-600">{r.body}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

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
