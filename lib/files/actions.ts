"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | void;

// The browser uploads bytes directly to the private "deliverables" bucket
// using the authenticated browser client (storage RLS enforces project
// membership on the path prefix); this just records the metadata row
// afterwards, same two-step pattern Supabase Storage is designed around.
export async function attachFile(
  projectId: string,
  storagePath: string,
  name: string,
  size: number,
  mime: string,
  milestoneId?: string,
): Promise<{ error: string } | { fileId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data, error } = await supabase
    .from("files")
    .insert({
      project_id: projectId,
      milestone_id: milestoneId ?? null,
      uploader_id: user.id,
      name,
      size,
      mime,
      storage_path: storagePath,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${projectId}`);
  return { fileId: data.id };
}

export async function getDownloadUrl(fileId: string): Promise<{ error: string } | { url: string }> {
  const supabase = await createClient();
  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (fileError || !file) return { error: "File not found." };

  const { data, error } = await supabase.storage
    .from("deliverables")
    .createSignedUrl(file.storage_path, 60);

  if (error || !data) return { error: error?.message ?? "Could not create download link." };

  return { url: data.signedUrl };
}
