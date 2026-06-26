import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { ProfileForm } from "./ProfileForm";
import { PortfolioSection } from "./PortfolioSection";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, bio, skills, hourly_rate, avatar_url, handle")
    .eq("id", user.id)
    .single();

  // Load portfolio items — skip gracefully on any DB error
  let itemsWithAttachments: {
    id: string;
    title: string;
    description: string | null;
    external_url: string | null;
    attachments: {
      id: string;
      portfolio_item_id: string;
      attachment_type: string;
      name: string;
      url: string | null;
      storage_path: string | null;
      mime: string | null;
      signedUrl: string | null;
    }[];
  }[] = [];

  try {
    const { data: portfolioItems } = await supabase
      .from("portfolio_items")
      .select("id, title, description, external_url, created_at")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    const itemIds = (portfolioItems ?? []).map((i) => i.id);

    const { data: allAttachments } = itemIds.length
      ? await supabase
          .from("portfolio_attachments")
          .select("id, portfolio_item_id, attachment_type, name, url, storage_path, mime")
          .in("portfolio_item_id", itemIds)
      : { data: [] as {
          id: string; portfolio_item_id: string; attachment_type: string;
          name: string; url: string | null; storage_path: string | null; mime: string | null;
        }[] };

    // Build signed URLs — skip any that fail
    const attachmentsWithUrls = await Promise.all(
      (allAttachments ?? []).map(async (a) => {
        if (a.storage_path) {
          try {
            const { data } = await supabase.storage
              .from("portfolio")
              .createSignedUrl(a.storage_path, 3600);
            return { ...a, signedUrl: data?.signedUrl ?? null };
          } catch {
            return { ...a, signedUrl: null };
          }
        }
        return { ...a, signedUrl: a.url };
      })
    );

    itemsWithAttachments = (portfolioItems ?? []).map((item) => ({
      ...item,
      attachments: attachmentsWithUrls.filter((a) => a.portfolio_item_id === item.id),
    }));
  } catch {
    // Portfolio failed to load — page still renders, just without items
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Your profile</h1>
          {profile?.handle && (
            <a
              href={`/p/${profile.handle}`}
              className="text-sm font-medium text-emerald-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View public profile →
            </a>
          )}
        </div>

        <ProfileForm profile={profile ?? null} email={user.email ?? ""} />

        {profile?.role === "freelancer" && (
          <PortfolioSection items={itemsWithAttachments} />
        )}
      </div>
    </div>
  );
}
