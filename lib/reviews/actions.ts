"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitReview(
  milestoneId: string,
  projectId: string,
  freelancerId: string,
  rating: number,
  body: string,
): Promise<{ error: string } | void> {
  if (rating < 1 || rating > 5) return { error: "Rating must be between 1 and 5." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("reviews").insert({
    milestone_id: milestoneId,
    project_id: projectId,
    reviewer_id: user.id,
    freelancer_id: freelancerId,
    rating,
    body: body.trim() || null,
  });

  if (error) {
    if (error.code === "23505") return; // already reviewed — silently ignore
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${projectId}`);
}
