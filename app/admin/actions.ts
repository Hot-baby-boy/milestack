"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { nairaToKobo, refundCharge, initiateTransfer } from "@/lib/paystack";
import { getOrCreateRecipientCode } from "@/lib/payments/payout-recipient";

export type ActionResult = { error: string } | void;

export async function adminLogin(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Please fill in every field." };

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) return { error: "Invalid email or password." };

  // Verify the user is in admin_users using the security-definer RPC (bypasses RLS)
  const { data: { user } } = await supabase.auth.getUser();
  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
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

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/login");
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

// The only way out of a disputed milestone now that real money is
// involved: an admin sends the client's money back. The Paystack refund
// call happens here (application layer) BEFORE the state transition, which
// only records it — see admin_refund_disputed_milestone() in migration 0011.
export async function refundDisputedMilestone(formData: FormData): Promise<ActionResult> {
  const milestoneId = String(formData.get("milestone_id") ?? "").trim();
  if (!milestoneId) return { error: "Missing milestone." };

  const { supabase } = await requireAdmin();

  const { data: milestone } = await supabase
    .from("milestones").select("id, amount, status, project_id").eq("id", milestoneId).single();
  if (!milestone) return { error: "Milestone not found." };
  if (milestone.status !== "disputed") return { error: "This milestone isn't disputed." };

  const { data: originalCharge } = await supabase
    .from("transactions").select("reference")
    .eq("milestone_id", milestoneId).eq("type", "charge").eq("gateway", "paystack")
    .single();
  if (!originalCharge?.reference) {
    return { error: "No real charge found for this milestone — nothing to refund via Paystack." };
  }

  const refundReference = `milestack_refund_${crypto.randomUUID()}`;
  try {
    await refundCharge({
      transactionReference: originalCharge.reference,
      amountKobo: nairaToKobo(Number(milestone.amount)),
      reference: refundReference,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Paystack refund failed." };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("admin_refund_disputed_milestone", {
    p_milestone_id: milestoneId,
    p_reference: refundReference,
  });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${milestone.project_id}`);
  revalidatePath("/admin");
}

// The other side of the same coin: pay the freelancer anyway (dispute
// resolved in their favor), via a real Paystack transfer.
export async function releaseDisputedMilestoneToFreelancer(formData: FormData): Promise<ActionResult> {
  const milestoneId = String(formData.get("milestone_id") ?? "").trim();
  if (!milestoneId) return { error: "Missing milestone." };

  const { supabase } = await requireAdmin();

  const { data: milestone } = await supabase
    .from("milestones").select("id, title, amount, status, project_id").eq("id", milestoneId).single();
  if (!milestone) return { error: "Milestone not found." };
  if (milestone.status !== "disputed") return { error: "This milestone isn't disputed." };

  const { data: project } = await supabase
    .from("projects").select("freelancer_id").eq("id", milestone.project_id).single();
  if (!project) return { error: "Project not found." };

  const recipientResult = await getOrCreateRecipientCode(supabase, project.freelancer_id);
  if ("error" in recipientResult) return { error: recipientResult.error };

  const transferReference = `milestack_admin_release_${crypto.randomUUID()}`;
  try {
    await initiateTransfer({
      recipientCode: recipientResult.recipientCode,
      amountKobo: nairaToKobo(Number(milestone.amount)),
      reference: transferReference,
      reason: `Milestack dispute resolution: ${milestone.title}`,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Paystack transfer failed." };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("admin_release_disputed_milestone", {
    p_milestone_id: milestoneId,
    p_reference: transferReference,
  });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${milestone.project_id}`);
  revalidatePath("/admin");
}
