import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar, MobileNav } from "@/components/AppSidebar";

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

  const unreadCount   = (notifications ?? []).filter(n => !n.read_at && n.type !== "dispute_opened").length;
  const disputeCount  = (notifications ?? []).filter(n => !n.read_at && n.type === "dispute_opened").length;

  const displayName = profile?.display_name ?? profile?.email ?? "User";
  const role        = profile?.role ?? "freelancer";
  const initials    = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const sidebarProps = { displayName, role, initials, unreadCount, disputeCount };

  return (
    /*
     * Mobile  → single column: [MobileNav sticky bar] then [main content]
     * Desktop → two columns:   [240px sidebar] + [main content]
     *
     * Using a plain block wrapper on mobile so MobileNav (a full-width sticky
     * bar) stacks above main.  lg:flex switches to a row for the sidebar.
     */
    <div className="min-h-screen lg:flex" style={{background:"linear-gradient(180deg,#FAFBFD 0%,#F8FAFC 45%,#F1F5FA 100%)"}}>
      {/* Desktop: sticky left sidebar */}
      <AppSidebar {...sidebarProps}/>

      {/* Right side: mobile top bar + page content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile sticky top bar — hidden on lg */}
        <MobileNav {...sidebarProps}/>
        {/* Page content */}
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
