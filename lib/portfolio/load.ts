import type { SupabaseClient } from "@supabase/supabase-js";

export type PortfolioFile = {
  id: string;
  portfolio_item_id: string;
  attachment_type: string;
  name: string;
  url: string | null;
  storage_path: string | null;
  mime: string | null;
  signedUrl: string | null;
};

export type PortfolioItemWithFiles = {
  id: string;
  title: string;
  description: string | null;
  external_url: string | null;
  attachments: PortfolioFile[];
};

// A user's portfolio items with their attachments, each file given a
// short-lived signed URL. Runs with the caller's own session, so the
// storage rules for the `portfolio` bucket decide who can see what.
export async function loadPortfolioWithFiles(
  supabase: SupabaseClient,
  userId: string,
): Promise<PortfolioItemWithFiles[]> {
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("id, title, description, external_url")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  const itemIds = (items ?? []).map((i) => i.id);
  if (!itemIds.length) return [];

  const { data: attachments } = await supabase
    .from("portfolio_attachments")
    .select("id, portfolio_item_id, attachment_type, name, url, storage_path, mime")
    .in("portfolio_item_id", itemIds);

  const withUrls: PortfolioFile[] = await Promise.all(
    (attachments ?? []).map(async (a) => {
      if (a.storage_path) {
        const { data } = await supabase.storage.from("portfolio").createSignedUrl(a.storage_path, 3600);
        return { ...a, signedUrl: data?.signedUrl ?? null };
      }
      return { ...a, signedUrl: a.url };
    }),
  );

  return (items ?? []).map((item) => ({
    ...item,
    attachments: withUrls.filter((a) => a.portfolio_item_id === item.id),
  }));
}
