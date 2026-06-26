import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/AppSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, email")
    .eq("id", user.id)
    .single();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, read_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const unreadCount = notifications?.filter(n => !n.read_at).length ?? 0;

  const displayName = profile?.display_name ?? profile?.email ?? "User";
  const role = profile?.role ?? "freelancer";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar
        displayName={displayName}
        role={role}
        initials={initials}
        unreadCount={unreadCount}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
