import type { SupabaseClient } from "@supabase/supabase-js";

export type Category = {
  slug: string;
  label: string;
  parent_slug: string | null;
  sort_order: number;
};

export type CategoryTree = {
  mains: Category[];
  nichesByMain: Record<string, Category[]>;
  // Turns any category or niche slug into its readable name.
  labelOf: (slug: string | null | undefined) => string;
};

export const MAX_NICHES = 5;

// The category list lives in the database (talent_categories), so the same
// list drives the sign-up form, the profile, the client directory and the
// database checks. Readable by anyone, including before sign-in.
export async function loadCategories(supabase: SupabaseClient): Promise<CategoryTree> {
  const { data } = await supabase
    .from("talent_categories")
    .select("slug, label, parent_slug, sort_order")
    .order("sort_order", { ascending: true });

  const all = (data ?? []) as Category[];
  const mains = all.filter((c) => !c.parent_slug);
  const nichesByMain: Record<string, Category[]> = {};
  for (const c of all) {
    if (c.parent_slug) (nichesByMain[c.parent_slug] ??= []).push(c);
  }
  const labels = new Map(all.map((c) => [c.slug, c.label]));
  return {
    mains,
    nichesByMain,
    labelOf: (slug) => (slug ? labels.get(slug) ?? slug : ""),
  };
}
