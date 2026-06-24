import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: preview } = (await supabase
    .rpc("get_invitation_preview", { p_token: token })
    .maybeSingle()) as {
    data: { project_id: string; project_name: string; freelancer_name: string } | null;
  };

  if (!preview) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-slate-900">Invite link invalid</h1>
        <p className="mt-2 text-sm text-slate-500">
          This invite link has expired or has already been used. Ask your freelancer to send a new one.
        </p>
      </Shell>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  const next = `/invite/${token}`;

  if (user) {
    // Already a member of this project? (e.g. revisiting an already-accepted link.)
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("id", preview.project_id)
      .maybeSingle();

    if (existing) redirect(`/dashboard/${preview.project_id}`);

    const { data: accepted, error } = await supabase.rpc("accept_invitation", { p_token: token }).single();

    if (error) {
      return (
        <Shell>
          <h1 className="text-xl font-semibold text-slate-900">Couldn&apos;t join this workspace</h1>
          <p className="mt-2 text-sm text-slate-500">{error.message}</p>
        </Shell>
      );
    }

    redirect(`/dashboard/${(accepted as { id: string }).id}`);
  }

  return (
    <Shell>
      <h1 className="text-xl font-semibold text-slate-900">
        {preview.freelancer_name} invited you to {preview.project_name}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Create an account or log in to join this workspace on Milestack.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="rounded-lg bg-emerald-500 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Create an account
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Log in
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-bold text-slate-900">
          <Logo size={28} />
          Milestack
        </div>
        {children}
      </div>
    </div>
  );
}
