"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type ActionResult = { error: string } | void;

// Only ever redirect to a path within this app — never to an external URL.
function safeNext(next: string | null): string | null {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return null;
}

export async function signup(formData: FormData): Promise<ActionResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "client");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!fullName || !email || !password) {
    return { error: "Please fill in every field." };
  }
  if (role !== "freelancer" && role !== "client") {
    return { error: "Invalid role." };
  }

  const supabase = await createClient();
  const confirmUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`);
  if (next) confirmUrl.searchParams.set("next", next);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: confirmUrl.toString(),
    },
  });

  if (error) return { error: error.message };

  redirect(next ? `/verify?next=${encodeURIComponent(next)}` : "/verify");
}

export async function login(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Please fill in every field." };
  }

  const supabase = await createClient();

  // Check rate limit BEFORE attempting — returns true if locked out
  const { data: isLocked } = await supabase.rpc("check_login_rate_limit", {
    p_email: email,
    p_succeeded: false,
  });
  if (isLocked) {
    return { error: "Too many failed attempts. Please wait 15 minutes and try again." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password." };
  }

  // Record success to reset the failure window
  await supabase.rpc("check_login_rate_limit", {
    p_email: email,
    p_succeeded: true,
  });

  redirect(next ?? "/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Please enter your email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
  });

  // Don't reveal whether the email exists — same message either way.
  if (error) return { error: "Something went wrong. Please try again." };
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  redirect("/dashboard");
}
