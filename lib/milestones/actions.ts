"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyByEmailForLatestEvent } from "@/lib/notifications/actions";

export type ActionResult = { error: string } | void;

export async function createMilestone(formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const dueDate = String(formData.get("dueDate") ?? "") || null;

  if (!projectId || !title || !amount || amount <= 0) {
    return { error: "Please fill in a title and a valid amount." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("milestones").insert({
    project_id: projectId,
    title,
    amount,
    due_date: dueDate,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${projectId}`);
}

export async function transitionMilestone(
  milestoneId: string,
  projectId: string,
  newStatus: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.rpc("transition_milestone", {
    p_milestone_id: milestoneId,
    p_new_status: newStatus,
  });

  if (error) return { error: error.message };

  if (user) await notifyByEmailForLatestEvent(projectId, user.id);

  revalidatePath(`/dashboard/${projectId}`);
}
