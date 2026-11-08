"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function saveCategory(_prev: unknown, formData: FormData): Promise<TalentResult> {
  const category = String(formData.get("category") ?? "").trim();
  const niches = formData.getAll("niches").map((n) => String(n));

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_talent_category", {
    p_category: category || null,
    p_niches: niches,
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

const CV_MAX_BYTES = 5 * 1024 * 1024;

export async function uploadCv(_prev: unknown, formData: FormData): Promise<TalentResult> {
  const file = formData.get("cv") as File | null;
  if (!file || file.size === 0) return { error: "Choose a PDF file first." };
  if (file.type !== "application/pdf") return { error: "Your CV must be a PDF." };
  if (file.size > CV_MAX_BYTES) return { error: "Your CV must be under 5 MB." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles").select("role, cv_path").eq("id", user.id).single();
  if (profile?.role !== "freelancer") return { error: "Only freelancers can upload a CV." };

  const path = `${user.id}/cv-${Date.now()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("cvs")
    .upload(path, await file.arrayBuffer(), { contentType: "application/pdf" });
  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await supabase.from("profiles").update({
    cv_path: path,
    cv_name: file.name.slice(0, 100),
    cv_uploaded_at: new Date().toISOString(),
  }).eq("id", user.id);
  if (updateError) {
    await supabase.storage.from("cvs").remove([path]);
    return { error: updateError.message };
  }

  // Remove the previous CV so old links stop working.
  if (profile.cv_path) await supabase.storage.from("cvs").remove([profile.cv_path]);

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function removeCv(): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase.from("profiles").select("cv_path").eq("id", user.id).single();
  const { error } = await supabase.from("profiles")
    .update({ cv_path: null, cv_name: null, cv_uploaded_at: null })
    .eq("id", user.id);
  if (error) return { error: error.message };

  if (profile?.cv_path) await supabase.storage.from("cvs").remove([profile.cv_path]);
  revalidatePath("/dashboard/profile");
}

// Clients only. The database function decides whether this CV may be
// downloaded; only then do we sign a 5-minute link with the service key,
// because the private bucket gives clients no direct access.
export async function getCvDownloadUrl(freelancerId: string): Promise<{ error: string } | { url: string }> {
  const supabase = await createClient();
  const { data: path, error } = await supabase.rpc("get_cv_path", { p_freelancer_id: freelancerId });
  if (error) return { error: error.message };
  if (!path) return { error: "This freelancer has no CV available." };

  const admin = createAdminClient();
  const { data, error: signError } = await admin.storage.from("cvs").createSignedUrl(String(path), 300);
  if (signError || !data) return { error: "Could not prepare the CV. Please try again." };
  return { url: data.signedUrl };
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
