import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ContactButton } from "./ContactButton";

type TalentProfile = {
  id: string; handle: string; display_name: string | null; headline: string | null;
  bio: string | null; skills: string[]; hourly_rate: number | null; avatar_url: string | null;
  linkedin_name: string | null; linkedin_url: string; avg_rating: number | null; review_count: number;
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

  const { data: portfolio } = await supabase
    .from("portfolio_items").select("id, title, description, external_url")
    .eq("user_id", t.id).order("position", { ascending: true });

  const { data: reviews } = await supabase
    .from("reviews").select("id, rating, body, created_at")
    .eq("freelancer_id", t.id).order("created_at", { ascending: false });

  const name = t.display_name ?? t.handle;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <Link href="/dashboard/talent" className="text-sm text-slate-500 hover:text-slate-700">← Talent</Link>

      <div className="mb-6 mt-4 flex items-start gap-5">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
          {t.avatar_url ? (
            <Image src={t.avatar_url} alt={name} fill className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl text-slate-400">{name[0]?.toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{name}</h1>
          <p className="text-sm text-slate-600">{t.headline}</p>
          <p className="mt-1 text-[13px] font-medium text-[#0A66C2]">
            ✓ LinkedIn verified{t.linkedin_name ? ` as ${t.linkedin_name}` : ""}
          </p>
          {t.avg_rating && (
            <p className="mt-1 text-sm text-slate-600">★ {t.avg_rating} ({t.review_count} review{t.review_count === 1 ? "" : "s"})</p>
          )}
          {t.hourly_rate && (
            <p className="mt-1 text-sm font-medium text-slate-700">USD {Number(t.hourly_rate).toLocaleString()}/hr</p>
          )}
        </div>
      </div>

      {t.bio && <p className="mb-4 text-sm leading-relaxed text-slate-600">{t.bio}</p>}
      <div className="mb-6 flex flex-wrap gap-2">
        {(t.skills ?? []).map((s) => (
          <span key={s} className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700">{s}</span>
        ))}
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
        <ContactButton freelancerId={t.id} />
        {contact ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-[13px] text-slate-500">
              Spoken to {name} and ready to work together? Send them a project link so the work and payment stay protected on Milestack.
            </p>
            <Link href={`/dashboard/talent/${t.handle}/propose`}
              className="inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-emerald-600">
              Send a project link
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-[12.5px] text-slate-400">
            Messaging happens on LinkedIn. After you contact them, you can send a Milestack project link from here.
          </p>
        )}
      </div>

      {(portfolio ?? []).length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Portfolio</h2>
          <div className="space-y-3">
            {portfolio!.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-medium text-slate-900">{p.title}</h3>
                {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                {p.external_url && (
                  <a href={p.external_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline">View project →</a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {(reviews ?? []).length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Client reviews</h2>
          <div className="space-y-3">
            {reviews!.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                <div className="mb-1 flex items-center justify-between text-[12px] text-slate-400">
                  <span className="text-amber-400">{"★".repeat(r.rating)}<span className="text-slate-200">{"★".repeat(5 - r.rating)}</span></span>
                  <span>{new Date(r.created_at).toLocaleDateString([], { month: "short", year: "numeric" })}</span>
                </div>
                {r.body && <p className="text-[13px] leading-relaxed text-slate-600">{r.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
