"use server";

// Single payments interface per CLAUDE.md rule #1: every money operation
// goes through here. Phase 2: real Paystack charges + payouts, Nigeria
// pilot only. The two RPCs that actually flip a milestone to funded/
// released (fund_milestone_from_payment / release_milestone_from_transfer)
// have no auth.uid() check and are locked down to the service-role key
// (see migration 0012) — they're only ever called from here, after we've
// independently confirmed with Paystack that money actually moved.

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nairaToKobo, verifyTransaction, initiateTransfer } from "@/lib/paystack";
import { getOrCreateRecipientCode } from "@/lib/payments/payout-recipient";
import type { ActionResult } from "@/lib/milestones/actions";

const PROTECTION_FEE_RATE = 0.10;

export type FundIntent =
  | { error: string }
  | { reference: string; amountKobo: number; email: string };

export async function initFundMilestone(milestoneId: string, projectId: string): Promise<FundIntent> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: milestone } = await supabase
    .from("milestones").select("id, amount, status").eq("id", milestoneId).single();
  if (!milestone) return { error: "Milestone not found." };
  if (milestone.status !== "draft") return { error: "This milestone isn't awaiting funding." };

  const { data: project } = await supabase
    .from("projects").select("client_id").eq("id", projectId).single();
  if (!project || project.client_id !== user.id) {
    return { error: "Only the client can fund this milestone." };
  }

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single();

  const totalNaira = Number(milestone.amount) * (1 + PROTECTION_FEE_RATE);
  const amountKobo = nairaToKobo(totalNaira);
  const reference = `milestack_fund_${crypto.randomUUID()}`;

  const { error } = await supabase.from("payment_intents").insert({
    milestone_id: milestoneId,
    project_id: projectId,
    actor_id: user.id,
    kind: "charge",
    reference,
    amount_kobo: amountKobo,
  });
  if (error) return { error: error.message };

  return { reference, amountKobo, email: profile?.email ?? user.email! };
}

// Called by the browser right after the Paystack Inline popup reports
// success. We don't trust that callback on its own — we ask Paystack's own
// API to confirm, then apply the result with the service-role client.
export async function confirmFundMilestone(reference: string, projectId: string): Promise<ActionResult> {
  let verified;
  try {
    verified = await verifyTransaction(reference);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not verify payment with Paystack." };
  }
  if (verified.status !== "success") {
    return { error: "Payment was not successful." };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("fund_milestone_from_payment", { p_reference: reference });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${projectId}`);
}

export async function releaseMilestone(milestoneId: string, projectId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: milestone } = await supabase
    .from("milestones").select("id, title, amount, status").eq("id", milestoneId).single();
  if (!milestone) return { error: "Milestone not found." };
  if (milestone.status !== "approved") return { error: "This milestone isn't awaiting release." };

  const { data: project } = await supabase
    .from("projects").select("client_id, freelancer_id").eq("id", projectId).single();
  if (!project || project.client_id !== user.id) {
    return { error: "Only the client can release this milestone." };
  }

  const recipientResult = await getOrCreateRecipientCode(supabase, project.freelancer_id);
  if ("error" in recipientResult) return { error: recipientResult.error };
  const { recipientCode } = recipientResult;

  const amountKobo = nairaToKobo(Number(milestone.amount));
  const reference = `milestack_release_${crypto.randomUUID()}`;

  const { error: insertError } = await supabase.from("payment_intents").insert({
    milestone_id: milestoneId,
    project_id: projectId,
    actor_id: user.id,
    kind: "transfer",
    reference,
    amount_kobo: amountKobo,
  });
  if (insertError) return { error: insertError.message };

  let transfer;
  try {
    transfer = await initiateTransfer({
      recipientCode,
      amountKobo,
      reference,
      reason: `Milestack milestone: ${milestone.title}`,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start the payout." };
  }

  // Test mode (and most real transfers) resolve synchronously — apply it
  // immediately rather than waiting on a webhook that can't reach a local
  // dev server anyway. A 'pending'/'otp' response still gets reconciled
  // later by the webhook once this is deployed with a public URL.
  if (transfer.status === "success") {
    const admin = createAdminClient();
    const { error } = await admin.rpc("release_milestone_from_transfer", { p_reference: reference });
    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/${projectId}`);
}
