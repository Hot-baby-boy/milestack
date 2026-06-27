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

  const unreadCount  = (notifications ?? []).filter(n => !n.read_at && n.type !== "dispute_opened").length;
  const disputeCount = (notifications ?? []).filter(n => !n.read_at && n.type === "dispute_opened").length;

  const displayName = profile?.display_name ?? profile?.email ?? "User";
  const role        = profile?.role ?? "freelancer";
  const initials    = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const p = { displayName, role, initials, unreadCount, disputeCount };

  return (
    /*
     * Outer: always flex-row via inline style — sidebar collapses to display:none
     * on mobile via Tailwind `hidden`, leaving only the right column visible.
     *
     * Right column is flex-col: [MobileNav sticky bar] on top, then page content.
     * MobileNav is hidden on desktop (lg:hidden).
     */
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(180deg,#FAFBFD 0%,#F8FAFC 45%,#F1F5FA 100%)",
      }}
    >
      {/* ── Desktop sidebar ── hidden on mobile, flex on lg */}
      <AppSidebar {...p} />

      {/* ── Right side: mobile top bar + page content ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <MobileNav {...p} />
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
