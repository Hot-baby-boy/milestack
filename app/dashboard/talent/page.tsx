import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProposalList } from "./ProposalList";
import { CategoryGrid } from "./CategoryGrid";
import { loadCategories } from "@/lib/talent/categories";

type Talent = {
  id: string; handle: string; display_name: string | null; headline: string | null;
  bio: string | null; skills: string[]; hourly_rate: number | null; avatar_url: string | null;
  linkedin_name: string | null; avg_rating: number | null; review_count: number;
  category: string | null; niches: string[]; category_other: string | null; banner_url: string | null;
};

export default async function TalentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; skill?: string; category?: string; niche?: string }>;
}) {
  const { q, skill, category, niche } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "client") redirect("/dashboard");

  const tree = await loadCategories(supabase);
  const filtered = !!(q || skill || category || niche);

  const { data } = await supabase.rpc("list_talent", {
    p_search: q ?? null,
    p_skill: skill ?? null,
    p_category: category ?? null,
    p_niche: niche ?? null,
  });
  const talent = (data ?? []) as Talent[];

  const { data: countRows } = await supabase.rpc("talent_category_counts");
  const counts: Record<string, number> = {};
  for (const r of (countRows ?? []) as { slug: string; listed_count: number }[]) {
    counts[r.slug] = Number(r.listed_count);
  }

  const activeCategory = category ? tree.mains.find((c) => c.slug === category) : undefined;
  const niches = activeCategory ? tree.nichesByMain[activeCategory.slug] ?? [] : [];
  const chipHref = (nicheSlug?: string) => {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (nicheSlug) p.set("niche", nicheSlug);
    if (q) p.set("q", q);
    if (skill) p.set("skill", skill);
    const qs = p.toString();
    return `/dashboard/talent${qs ? `?${qs}` : ""}`;
  };

  const { data: proposals } = await supabase
    .from("project_proposals")
    .select("id, name, status, token, project_id, created_at, freelancer_id")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="sticky top-0 z-30 hidden h-[72px] items-center border-b border-slate-200 bg-white pl-8 pr-16 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Talent</h1>
      </div>

      <div className="px-4 py-5 sm:px-8 sm:py-8">
        <h2 className="text-[24px] font-bold tracking-tight text-[#0F172A]">LinkedIn-verified freelancers</h2>
        <p className="mb-5 mt-1 text-[14.5px] text-slate-500">
          Find someone, contact them on LinkedIn, then send them a project link here.
        </p>

        <form className="mb-5 flex flex-wrap gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {niche && <input type="hidden" name="niche" value={niche} />}
          <input name="q" defaultValue={q ?? ""} placeholder="Search by name, headline or bio"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
          <input name="skill" defaultValue={skill ?? ""} placeholder="Skill (e.g. Figma)"
            className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
          <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
            Search
          </button>
        </form>

        {activeCategory && (
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2 text-[13px] text-slate-500">
              <Link href="/dashboard/talent" className="hover:text-slate-700">All talent</Link>
              <span>/</span>
              <span className="font-medium text-slate-800">{activeCategory.label}</span>
            </div>
            {niches.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Link href={chipHref()}
                className={`rounded-full border px-3 py-1.5 text-[13px] transition ${!niche ? "border-emerald-500 bg-emerald-50 font-medium text-emerald-700" : "border-slate-300 text-slate-600 hover:border-emerald-300"}`}>
                All {activeCategory.label}
              </Link>
              {niches.map((n) => (
                <Link key={n.slug} href={chipHref(n.slug)}
                  className={`rounded-full border px-3 py-1.5 text-[13px] transition ${niche === n.slug ? "border-emerald-500 bg-emerald-50 font-medium text-emerald-700" : "border-slate-300 text-slate-600 hover:border-emerald-300"}`}>
                  {n.label}
                </Link>
              ))}
            </div>
            )}
          </div>
        )}

        {!filtered && (
          <>
            <h2 className="mb-3 text-[15px] font-bold text-[#0F172A]">Browse by category</h2>
            <div className="mb-8">
              <CategoryGrid mains={tree.mains} counts={counts} nichesByMain={tree.nichesByMain} />
            </div>
          </>
        )}

        {(!filtered ? talent.length > 0 : true) && (
          <h2 className="mb-3 text-[15px] font-bold text-[#0F172A]">
            {!filtered ? "Top talent" : activeCategory ? `${activeCategory.label} talent` : "Search results"}
          </h2>
        )}

        {!talent.length ? (
          filtered ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
              <h3 className="mb-1 text-[15px] font-bold text-[#0F172A]">No freelancers found</h3>
              <p className="text-sm text-slate-500">Try a different search or niche, or browse another category.</p>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
              <h3 className="mb-1 text-[15px] font-bold text-[#0F172A]">No freelancers listed yet</h3>
              <p className="text-sm text-slate-500">Verified freelancers will appear here as they list themselves.</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(filtered ? talent : talent.slice(0, 6)).map((t) => {
              const name = t.display_name ?? t.handle;
              const tags = t.category === "other" && t.category_other
                ? [t.category_other]
                : (t.niches ?? []).length
                  ? t.niches.slice(0, 3).map((n) => tree.labelOf(n))
                  : (t.skills ?? []).slice(0, 3);
              return (
                <Link key={t.id} href={`/dashboard/talent/${t.handle}`}
                  className="group flex flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.10)]"
                >
                  <div className="relative aspect-[16/7] w-full overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-slate-100">
                    {t.banner_url && (
                      <Image src={t.banner_url} alt="" fill className="object-cover transition group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5 pt-0">
                    <div className="-mt-7 flex items-end gap-3">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-[3px] border-white bg-slate-200 shadow-sm">
                        {t.avatar_url ? (
                          <Image src={t.avatar_url} alt={name} fill className="object-cover" sizes="56px" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-lg text-slate-500">
                            {name[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 pb-0.5">
                        <h3 className="truncate text-[15px] font-semibold text-[#0F172A]">{name}</h3>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-[13.5px] leading-snug text-slate-600">{t.headline}</p>
                    {t.category && (
                      <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">{tree.labelOf(t.category)}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((s) => (
                        <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-medium text-emerald-700">{s}</span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-1 text-[12px] text-slate-500">
                      <span className="font-medium text-[#0A66C2]">✓ LinkedIn verified</span>
                      <span>
                        {t.avg_rating ? `★ ${t.avg_rating} (${t.review_count})` : "No reviews yet"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <h2 className="mb-3 mt-10 text-[15px] font-bold text-[#0F172A]">Your project links</h2>
        <ProposalList proposals={proposals ?? []} />
      </div>
    </div>
  );
}
