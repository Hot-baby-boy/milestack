import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { AcceptButton } from "./AcceptButton";

type Preview = {
  name: string; description: string | null; client_name: string;
  milestones: { title: string; amount: number }[];
};

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_proposal_preview", { p_token: token }).maybeSingle();
  const preview = data as Preview | null;

  if (!preview) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-slate-900">Project link invalid</h1>
        <p className="mt-2 text-sm text-slate-500">
          This link has expired, been cancelled, or already been used. Ask the client to send a new one.
        </p>
      </Shell>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  const next = `/proposal/${token}`;
  let role: string | null = null;
  if (user) {
    const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    role = me?.role ?? null;
  }

  const total = (preview.milestones ?? []).reduce((s, m) => s + Number(m.amount), 0);

  return (
    <Shell>
      <h1 className="text-xl font-semibold text-slate-900">
        {preview.client_name} invited you to work on {preview.name}
      </h1>
      {preview.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{preview.description}</p>}

      {(preview.milestones ?? []).length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200">
          {preview.milestones.map((m, i) => (
            <div key={i} className="flex justify-between border-b border-slate-100 px-4 py-2.5 text-sm last:border-0">
              <span className="text-slate-700">{m.title}</span>
              <span className="font-mono text-slate-900">NGN {Number(m.amount).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between bg-slate-50 px-4 py-2.5 text-sm font-semibold">
            <span>Total</span><span className="font-mono">NGN {total.toLocaleString()}</span>
          </div>
        </div>
      )}

      <p className="mt-4 text-[12.5px] text-slate-400">
        Milestack holds the client&apos;s payment in escrow and releases it to you as each milestone is approved.
      </p>

      <div className="mt-5 flex flex-col gap-2">
        {!user && (
          <>
            <Link href={`/signup?next=${encodeURIComponent(next)}`}
              className="rounded-lg bg-emerald-500 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-600">
              Create a freelancer account
            </Link>
            <Link href={`/login?next=${encodeURIComponent(next)}`}
              className="rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Log in
            </Link>
          </>
        )}
        {user && role === "freelancer" && <AcceptButton token={token} />}
        {user && role !== "freelancer" && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            You&apos;re logged in with a client account. Log in with your freelancer account to accept this project.
          </p>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-bold text-slate-900">
          <Logo size={28} />
          Milestack
        </div>
        {children}
      </div>
    </div>
  );
}
