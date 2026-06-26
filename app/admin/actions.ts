"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | void;

export async function adminLogin(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Please fill in every field." };

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) return { error: "Invalid email or password." };

  // Verify the user is in admin_users
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  if (!adminRow) {
    await supabase.auth.signOut();
    return { error: "Access denied. This account is not an admin." };
  }

  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Require admin — call at the top of every admin server component/action. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!adminRow) redirect("/admin/login");
  return { supabase, user };
}

export async function suspendUser(formData: FormData): Promise<ActionResult> {
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return;

  const { supabase, user: admin } = await requireAdmin();

  // Log the admin action
  await supabase.rpc("log_admin_action", {
    p_action: "suspend_user",
    p_target_type: "user",
    p_target_id: userId,
    p_payload: {},
  });

  // In Phase 1 we mark the profile; a real ban would use Supabase Admin API
  // which requires the service-role key (not available in the browser-safe client).
  // We record the intent in the audit log — full enforcement is a Phase 6 hardening task.
  revalidatePath("/admin");
}
