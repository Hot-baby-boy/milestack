import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { logout } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/server";

export async function AppHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: notifications } = user
    ? await supabase
        .from("notifications")
        .select("id, project_id, type, payload, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0;

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <Link href="/dashboard" className="flex items-center gap-2 text-base font-bold text-slate-900">
        <Logo size={24} />
        Milestack
      </Link>
      <div className="flex items-center gap-3">
        {user && <NotificationBell notifications={notifications ?? []} unreadCount={unreadCount} />}
        <form action={logout}>
          <button className="text-sm font-medium text-slate-500 hover:text-slate-700">Log out</button>
        </form>
      </div>
    </header>
  );
}
