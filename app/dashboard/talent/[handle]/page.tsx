import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadPortfolioWithFiles } from "@/lib/portfolio/load";
import { loadCategories } from "@/lib/talent/categories";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { PortfolioGrid } from "@/components/profile/PortfolioGrid";
import { ReviewsList } from "@/components/profile/ReviewsList";
import { Chips } from "@/components/profile/Chips";
import { ContactButton } from "./ContactButton";
import { CvButton } from "./CvButton";

type TalentProfile = {
  id: string; handle: string; display_name: string | null; headline: string | null;
  bio: string | null; skills: string[]; hourly_rate: number | null; avatar_url: string | null;
  linkedin_name: string | null; linkedin_url: string; avg_rating: number | null; review_count: number;
  has_cv: boolean; cv_name: string | null;
  category: string | null; niches: string[]; category_other: string | null; banner_url: string | null;
};

export default async function TalentProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "client") redirect("/dashboard");

  const { data } = await supabase.rpc("get_talent_profile", { p_handle: handle }).maybeSingle();
  const t = data as TalentProfile | null;
  if (!t) notFound();

  const { data: contact } = await supabase
    .from("talent_contacts").select("id").eq("client_id", user.id).eq("freelancer_id", t.id).maybeSingle();

  const portfolio = await loadPortfolioWithFiles(supabase, t.id);
  const tree = await loadCategories(supabase);

  const { data: reviews } = await supabase
    .from("reviews").select("id, rating, body, created_at")
    .eq("freelancer_id", t.id).order("created_at", { ascending: false });

  const name = t.display_name ?? t.handle;
  const categoryLabel = t.category === "other" && t.category_other
    ? t.category_other
    : t.category ? tree.labelOf(t.category) : null;

  const stats = [
    ...(t.avg_rating ? [{ label: "Rating", value: `★ ${t.avg_rating}` }] : []),
    { label: "Reviews", value: String(t.review_count) },
    ...(t.hourly_rate ? [{ label: "Hourly rate", value: `USD ${Number(t.hourly_rate).toLocaleString()}` }] : []),
    { label: "Portfolio items", value: String(portfolio.length) },
  ];

  const niches = t.category === "other" ? [] : (t.niches ?? []).map((n) => tree.labelOf(n));

  const actions = (
    <>
      <ContactButton freelancerId={t.id} />
      {t.has_cv && <CvButton freelancerId={t.id} cvName={t.cv_name} />}
      {contact ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-3 text-[13px] leading-relaxed text-emerald-900">
            Spoken to {name} and ready to work together? Send a project link so the work and payment stay protected on Milestack.
          </p>
          <Link href={`/dashboard/talent/${t.handle}/propose`}
            className="block rounded-xl bg-emerald-500 px-5 py-3 text-center text-[15px] font-semibold text-white hover:bg-emerald-600">
            Send a project link
          </Link>
        </div>
      ) : (
        <p className="text-[12.5px] leading-relaxed text-slate-400">
          Messaging happens on LinkedIn. After you contact them, you can send a Milestack project link from here.
        </p>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6">
      <Link href="/dashboard/talent" className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700">← Talent</Link>
      <ProfileShell
        name={name}
        headline={t.headline}
        categoryLabel={categoryLabel}
        avatarUrl={t.avatar_url}
        bannerUrl={t.banner_url}
        verified
        actions={actions}
        stats={stats}
        about={t.bio}
        chips={
          <div className="space-y-5">
            {niches.length > 0 && (
              <div>
                <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">Niches</h2>
                <Chips items={niches} tone="emerald" />
              </div>
            )}
            {(t.skills ?? []).length > 0 && (
              <div>
                <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">Skills</h2>
                <Chips items={t.skills} />
              </div>
            )}
          </div>
        }
      >
        <ProfileTabs
          workCount={portfolio.length}
          reviewCount={(reviews ?? []).length}
          work={<PortfolioGrid items={portfolio} />}
          reviews={
            (reviews ?? []).length
              ? <ReviewsList reviews={reviews!} />
              : <p className="text-[15px] text-slate-400">No reviews yet.</p>
          }
        />
      </ProfileShell>
    </div>
  );
}
