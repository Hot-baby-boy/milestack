"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TalentResult = { error: string } | { success: true };

export async function saveTalentListing(_prev: unknown, formData: FormData): Promise<TalentResult> {
  const headline = String(formData.get("headline") ?? "");
  const linkedinUrl = String(formData.get("linkedin_url") ?? "");
  const listed = formData.get("talent_listed") === "on";

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_talent_listing", {
    p_headline: headline,
    p_linkedin_url: linkedinUrl,
    p_listed: listed,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/profile");
  return { success: true };
}

// Records that a client clicked "Contact on LinkedIn" and returns the
// freelancer's LinkedIn URL to open. The URL is only ever released to a
// client, by a database function that also checks the freelancer is listed.
export async function contactOnLinkedIn(freelancerId: string): Promise<{ error: string } | { url: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_talent_contact", { p_freelancer_id: freelancerId });
  if (error) return { error: error.message };
  return { url: String(data) };
}

export type ProposalResult = { error: string } | { token: string };

export async function createProposal(formData: FormData): Promise<ProposalResult> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const freelancerId = String(formData.get("freelancer_id") ?? "").trim() || null;

  if (!name) return { error: "Give the project a name." };

  const titles = formData.getAll("milestone_title").map((t) => String(t).trim());
  const amounts = formData.getAll("milestone_amount").map((a) => Number(a));
  const milestones: { title: string; amount: number }[] = [];
  for (let i = 0; i < titles.length; i++) {
    if (!titles[i] && !amounts[i]) continue;
    if (!titles[i] || !(amounts[i] > 0)) {
      return { error: "Each milestone needs a title and an amount greater than zero." };
    }
    milestones.push({ title: titles[i], amount: amounts[i] });
  }
  if (milestones.length > 10) return { error: "A proposal can have at most 10 milestones." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const token = crypto.randomUUID();
  const { error } = await supabase.from("project_proposals").insert({
    client_id: user.id,
    freelancer_id: freelancerId,
    name,
    description: description || null,
    milestones,
    token,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/talent");
  return { token };
}

export async function cancelProposal(proposalId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_proposals")
    .update({ status: "cancelled" })
    .eq("id", proposalId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/talent");
}

export async function acceptProposal(token: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_proposal", { p_token: token }).single();
  if (error) return { error: error.message };
  redirect(`/dashboard/${(data as { id: string }).id}`);
}
