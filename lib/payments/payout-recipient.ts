// Plain utility (no "use server") — takes a live Supabase client instance,
// which server actions can't accept as an argument once exported from a
// "use server" file. Shared by releaseMilestone() and the admin
// "pay freelancer anyway" dispute-resolution action.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createTransferRecipient } from "@/lib/paystack";

export async function getOrCreateRecipientCode(
  supabase: SupabaseClient,
  freelancerId: string,
): Promise<{ error: string } | { recipientCode: string }> {
  const { data: freelancerProfile } = await supabase
    .from("profiles")
    .select("payout_method, payout_details, paystack_recipient_code")
    .eq("id", freelancerId).single();

  if (!freelancerProfile || freelancerProfile.payout_method !== "local_bank" || !freelancerProfile.payout_details) {
    return { error: "The freelancer hasn't set up a payout method yet." };
  }

  if (freelancerProfile.paystack_recipient_code) {
    return { recipientCode: freelancerProfile.paystack_recipient_code };
  }

  let details: { bank_code?: string; account_number?: string; account_name?: string };
  try {
    details = JSON.parse(freelancerProfile.payout_details);
  } catch {
    return { error: "The freelancer's payout details are invalid — ask them to re-save it." };
  }
  if (!details.bank_code || !details.account_number || !details.account_name) {
    return { error: "The freelancer's payout method isn't verified yet — ask them to re-save it." };
  }

  let recipientCode: string;
  try {
    recipientCode = await createTransferRecipient({
      name: details.account_name,
      accountNumber: details.account_number,
      bankCode: details.bank_code,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not set up the freelancer's payout." };
  }

  await supabase.from("profiles").update({ paystack_recipient_code: recipientCode }).eq("id", freelancerId);
  return { recipientCode };
}
