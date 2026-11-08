import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PayoutMethodForm } from "../profile/PayoutMethodForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, payout_method, payout_details")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 hidden h-[72px] items-center border-b border-slate-200 bg-white pl-8 pr-16 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Settings</h1>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
          <h2 className="text-[18px] font-bold text-[#0F172A]">Account</h2>
          <p className="mt-3 text-[13px] font-medium text-slate-500">Email</p>
          <p className="text-[15px] text-slate-800">{user.email}</p>
        </section>

        {profile?.role === "freelancer" && (
          <PayoutMethodForm
            initialMethod={profile.payout_method ?? null}
            initialDetails={profile.payout_details ?? null}
          />
        )}
      </div>
    </div>
  );
}
