import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProposalList } from "./ProposalList";

type Talent = {
  id: string; handle: string; display_name: string | null; headline: string | null;
  bio: string | null; skills: string[]; hourly_rate: number | null; avatar_url: string | null;
  linkedin_name: string | null; avg_rating: number | null; review_count: number;
};

export default async function TalentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; skill?: string }>;
}) {
  const { q, skill } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "client") redirect("/dashboard");

  const { data } = await supabase.rpc("list_talent", {
    p_search: q ?? null,
    p_skill: skill ?? null,
  });
  const talent = (data ?? []) as Talent[];

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
        <p className="mb-4 text-[13.5px] text-slate-500">
          LinkedIn-verified freelancers. Find someone, contact them on LinkedIn, then send them a project link here.
        </p>

        <form className="mb-6 flex flex-wrap gap-2">
          <input name="q" defaultValue={q ?? ""} placeholder="Search by name, headline or bio"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
          <input name="skill" defaultValue={skill ?? ""} placeholder="Skill (e.g. Figma)"
            className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
          <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
            Search
          </button>
        </form>

        {!talent.length ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
            <h3 className="mb-1 text-[15px] font-bold text-[#0F172A]">No freelancers found</h3>
            <p className="text-sm text-slate-500">
              {q || skill ? "Try a different search." : "Verified freelancers will appear here as they list themselves."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {talent.map((t) => {
              const name = t.display_name ?? t.handle;
              return (
                <Link key={t.id} href={`/dashboard/talent/${t.handle}`}
                  className="flex flex-col gap-3 rounded-[14px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                      {t.avatar_url ? (
                        <Image src={t.avatar_url} alt={name} fill className="object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg text-slate-500">
                          {name[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-[#0F172A]">{name}</h3>
                      <p className="truncate text-[12.5px] text-slate-500">{t.headline}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(t.skills ?? []).slice(0, 4).map((s) => (
                      <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-medium text-emerald-700">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-slate-500">
                    <span className="font-medium text-[#0A66C2]">✓ LinkedIn verified</span>
                    <span>
                      {t.avg_rating ? `★ ${t.avg_rating} (${t.review_count})` : "No reviews yet"}
                    </span>
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
