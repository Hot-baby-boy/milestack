import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadPortfolioWithFiles, type PortfolioItemWithFiles } from "@/lib/portfolio/load";
import { loadCategories } from "@/lib/talent/categories";
import { ProfileForm } from "./ProfileForm";
import { ProfileHeader } from "./ProfileHeader";
import { AboutCard } from "./AboutCard";
import { PortfolioGallery } from "./PortfolioGallery";
import { SkillsCard } from "./SkillsCard";
import { CategoryCard } from "./CategoryCard";
import { StrengthCard, type Strength } from "./StrengthCard";
import { TalentCard } from "./TalentCard";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ linkedin?: string; msg?: string }>;
}) {
  const { linkedin, msg } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, bio, skills, hourly_rate, avatar_url, handle, headline, linkedin_url, linkedin_name, linkedin_verified_at, talent_listed, cv_name, category, niches, category_other, banner_url")
    .eq("id", user.id)
    .single();

  const isFreelancer = profile?.role === "freelancer";

  // Clients keep the simple profile form.
  if (!isFreelancer) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-30 hidden h-[72px] items-center border-b border-slate-200 bg-white pl-8 pr-16 lg:flex">
          <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Profile</h1>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
          <ProfileForm profile={profile ?? null} email={user.email ?? ""} />
        </div>
      </div>
    );
  }

  // Freelancer data: portfolio (skipped quietly on any error), categories,
  // profile strength and review summary.
  let portfolio: PortfolioItemWithFiles[] = [];
  try {
    portfolio = await loadPortfolioWithFiles(supabase, user.id);
  } catch {
    // The page still renders without the gallery.
  }

  const tree = await loadCategories(supabase);
  const { data: strengthData } = await supabase.rpc("my_profile_strength").maybeSingle();
  const strength = (strengthData as Strength) ?? null;

  const { data: reviewRows } = await supabase.from("reviews").select("rating").eq("freelancer_id", user.id);
  const rating = reviewRows?.length
    ? { avg: reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length, count: reviewRows.length }
    : null;

  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "Your name";

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 hidden h-[72px] items-center border-b border-slate-200 bg-white pl-8 pr-16 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Talent profile</h1>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <ProfileHeader
              name={name}
              handle={profile?.handle ?? null}
              headline={profile?.headline ?? null}
              avatarUrl={profile?.avatar_url ?? null}
              bannerUrl={profile?.banner_url ?? null}
              hourlyRate={profile?.hourly_rate ?? null}
              rating={rating}
            />
            <AboutCard bio={profile?.bio ?? null} />
            <PortfolioGallery items={portfolio} />
            <SkillsCard skills={profile?.skills ?? []} />
            <CategoryCard
              mains={tree.mains}
              nichesByMain={tree.nichesByMain}
              category={profile?.category ?? null}
              niches={profile?.niches ?? []}
              categoryOther={profile?.category_other ?? null}
            />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <StrengthCard strength={strength} />
            <TalentCard
              headline={profile?.headline ?? null}
              linkedinUrl={profile?.linkedin_url ?? null}
              linkedinName={profile?.linkedin_name ?? null}
              verified={!!profile?.linkedin_verified_at}
              listed={!!profile?.talent_listed}
              hasHandle={!!profile?.handle}
              hasBio={!!profile?.bio?.trim()}
              hasSkills={(profile?.skills ?? []).length > 0}
              hasCategory={!!profile?.category && (profile.category !== "other" || !!profile.category_other?.trim())}
              cvName={profile?.cv_name ?? null}
              notice={linkedin ? { status: linkedin, msg } : null}
            />
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-3 text-[18px] font-bold text-[#0F172A]">Quick links</h2>
              <ul className="space-y-2 text-[14.5px]">
                {profile?.handle && (
                  <li>
                    <a href={`/p/${profile.handle}`} target="_blank" rel="noopener noreferrer"
                      className="font-medium text-emerald-700 hover:underline">View my public profile →</a>
                  </li>
                )}
                <li>
                  <Link href="/dashboard/settings" className="font-medium text-emerald-700 hover:underline">
                    Payout and account settings →
                  </Link>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
