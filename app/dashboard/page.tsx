import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role, display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-900">You&apos;re logged in 🎉</p>
        <p className="mt-2 text-sm text-slate-500">
          {profile?.email} — <span className="capitalize">{profile?.role}</span>
        </p>
        <form action={logout} className="mt-6">
          <button className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
