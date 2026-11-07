import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProposalForm } from "./ProposalForm";

export default async function ProposePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "client") redirect("/dashboard");

  const { data } = await supabase.rpc("get_talent_profile", { p_handle: handle }).maybeSingle();
  const t = data as { id: string; handle: string; display_name: string | null } | null;
  if (!t) notFound();

  // Project links come after a LinkedIn conversation, so require a recorded contact.
  const { data: contact } = await supabase
    .from("talent_contacts").select("id").eq("client_id", user.id).eq("freelancer_id", t.id).maybeSingle();
  if (!contact) redirect(`/dashboard/talent/${handle}`);

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-8">
      <Link href={`/dashboard/talent/${handle}`} className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
      <h1 className="mb-1 mt-4 text-xl font-bold text-slate-900">Send a project link to {t.display_name ?? t.handle}</h1>
      <p className="mb-6 text-sm text-slate-500">
        Describe the work and add the milestones you&apos;ve agreed. You&apos;ll get a link to send them on LinkedIn.
        When they accept, a protected workspace is created with these milestones ready for you to fund.
      </p>
      <ProposalForm freelancerId={t.id} />
    </div>
  );
}
