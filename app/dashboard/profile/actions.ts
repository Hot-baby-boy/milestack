"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { success: true };

export async function updateProfile(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const display_name = String(formData.get("display_name") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase() || null;
  const hourly_rate_raw = String(formData.get("hourly_rate") ?? "").trim();
  const hourly_rate = hourly_rate_raw ? parseFloat(hourly_rate_raw) : null;
  const skillsRaw = String(formData.get("skills") ?? "").trim();
  const skills = skillsRaw
    ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_profile", {
    p_display_name: display_name,
    p_bio: bio,
    p_skills: skills,
    p_hourly_rate: hourly_rate,
    p_handle: handle,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function uploadAvatar(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "No file selected." };
  if (file.size > 2 * 1024 * 1024) return { error: "Avatar must be under 2 MB." };
  if (!file.type.startsWith("image/")) return { error: "Only image files are allowed." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: profileError } = await supabase.rpc("update_profile", {
    p_avatar_url: publicUrl,
  });

  if (profileError) return { error: profileError.message };
  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function addPortfolioItem(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const external_url = String(formData.get("external_url") ?? "").trim() || null;

  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: item, error } = await supabase
    .from("portfolio_items")
    .insert({ user_id: user.id, title, description, external_url })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Handle file attachments
  const attachmentFiles = formData.getAll("attachment_files") as File[];
  for (const file of attachmentFiles) {
    if (!file || file.size === 0) continue;
    if (file.size > 10 * 1024 * 1024) return { error: `${file.name} exceeds 10 MB.` };

    const isImage = file.type.startsWith("image/");
    const isDoc = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.type);

    if (!isImage && !isDoc) return { error: `${file.name} is not an allowed type (image or PDF/Word).` };

    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `${user.id}/${item.id}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("portfolio")
      .upload(storagePath, bytes, { contentType: file.type });

    if (uploadError) return { error: uploadError.message };

    await supabase.from("portfolio_attachments").insert({
      portfolio_item_id: item.id,
      user_id: user.id,
      attachment_type: isImage ? "image" : "doc",
      name: file.name,
      storage_path: storagePath,
      mime: file.type,
      size: file.size,
    });
  }

  // Handle link attachments
  const linkName = String(formData.get("link_name") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  if (linkUrl) {
    await supabase.from("portfolio_attachments").insert({
      portfolio_item_id: item.id,
      user_id: user.id,
      attachment_type: "link",
      name: linkName || linkUrl,
      url: linkUrl,
    });
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function deletePortfolioItem(formData: FormData): Promise<void> {
  const itemId = String(formData.get("item_id") ?? "").trim();
  if (!itemId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: attachments } = await supabase
    .from("portfolio_attachments")
    .select("storage_path")
    .eq("portfolio_item_id", itemId)
    .not("storage_path", "is", null);

  if (attachments?.length) {
    const paths = attachments.map((a) => a.storage_path!).filter(Boolean);
    await supabase.storage.from("portfolio").remove(paths);
  }

  await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/profile");
}
