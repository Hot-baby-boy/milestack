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
    .select("id, type, read_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const unreadCount = (notifications ?? []).filter(n => !n.read_at && n.type !== "dispute_opened").length;
  const disputeCount = (notifications ?? []).filter(n => !n.read_at && n.type === "dispute_opened").length;

  const displayName = profile?.display_name ?? profile?.email ?? "User";
  const role = profile?.role ?? "freelancer";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen" style={{background:"linear-gradient(180deg,#FAFBFD 0%,#F8FAFC 45%,#F1F5FA 100%)"}}>
      <AppSidebar
        displayName={displayName}
        role={role}
        initials={initials}
        unreadCount={unreadCount}
        disputeCount={disputeCount}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
