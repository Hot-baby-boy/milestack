import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { loadPortfolioWithFiles } from "@/lib/portfolio/load";
import { loadCategories } from "@/lib/talent/categories";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { PortfolioGrid } from "@/components/profile/PortfolioGrid";
import { ReviewsList } from "@/components/profile/ReviewsList";
import { Chips } from "@/components/profile/Chips";

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
    .select("id, display_name, bio, skills, hourly_rate, avatar_url, banner_url, headline, role, category, niches, category_other")
    .eq("handle", handle)
    .single();

  if (!profile) notFound();

  const isFreelancer = profile.role === "freelancer";
  const itemsWithAttachments = isFreelancer ? await loadPortfolioWithFiles(supabase, profile.id) : [];
  const tree = await loadCategories(supabase);

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

  const reviewItems = (reviews ?? []).map((r) => {
    const rp = reviewerMap[r.reviewer_id];
    const fullName = rp?.display_name ?? rp?.email ?? "Client";
    const parts = fullName.split(" ");
    const short = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
    return { id: r.id, rating: r.rating, body: r.body, created_at: r.created_at, name: short };
  });

  const avgRating = reviewItems.length
    ? reviewItems.reduce((s, r) => s + r.rating, 0) / reviewItems.length
    : null;

  const name = profile.display_name ?? handle;
  const categoryLabel = profile.category === "other" && profile.category_other
    ? profile.category_other
    : profile.category ? tree.labelOf(profile.category) : isFreelancer ? null : "Client";

  const stats = [
    ...(avgRating !== null ? [{ label: "Rating", value: `★ ${avgRating.toFixed(1)}` }] : []),
    ...(isFreelancer ? [{ label: "Reviews", value: String(reviewItems.length) }] : []),
    ...(profile.hourly_rate ? [{ label: "Hourly rate", value: `USD ${Number(profile.hourly_rate).toLocaleString()}` }] : []),
    ...(isFreelancer ? [{ label: "Portfolio items", value: String(itemsWithAttachments.length) }] : []),
  ];

  const tags = [
    ...(profile.category === "other" ? [] : (profile.niches ?? []).map((n: string) => tree.labelOf(n))),
  ];

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6">
        <ProfileShell
          name={name}
          headline={profile.headline ?? null}
          categoryLabel={categoryLabel}
          avatarUrl={profile.avatar_url ?? null}
          bannerUrl={profile.banner_url ?? null}
          stats={stats}
          about={profile.bio ?? null}
          chips={
            <div className="space-y-5">
              {tags.length > 0 && (
                <div>
                  <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">Niches</h2>
                  <Chips items={tags} tone="emerald" />
                </div>
              )}
              {(profile.skills ?? []).length > 0 && (
                <div>
                  <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">Skills</h2>
                  <Chips items={profile.skills as string[]} />
                </div>
              )}
            </div>
          }
        >
          {isFreelancer ? (
            <ProfileTabs
              workCount={itemsWithAttachments.length}
              reviewCount={reviewItems.length}
              work={<PortfolioGrid items={itemsWithAttachments} />}
              reviews={
                reviewItems.length ? <ReviewsList reviews={reviewItems} />
                  : <p className="text-[15px] text-slate-400">No reviews yet.</p>
              }
            />
          ) : (
            <p className="text-[15px] text-slate-400">This is a client profile.</p>
          )}
        </ProfileShell>
      </div>
    </div>
  );
}
