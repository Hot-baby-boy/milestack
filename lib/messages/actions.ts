"use server";

import { createClient } from "@/lib/supabase/server";
import { notifyByEmailForLatestEvent } from "@/lib/notifications/actions";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | void;

export async function sendMessage(
  projectId: string,
  body: string,
  attachmentId?: string,
): Promise<ActionResult> {
  if (!body.trim() && !attachmentId) {
    return { error: "Message can't be empty." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.rpc("post_message", {
    p_project_id: projectId,
    p_type: "text",
    p_body: body.trim() || "Sent an attachment",
    p_attachment_id: attachmentId ?? null,
  });

  if (error) return { error: error.message };

  if (user) await notifyByEmailForLatestEvent(projectId, user.id);

  revalidatePath(`/dashboard/${projectId}`);
}

export async function requestMilestone(
  projectId: string,
  title: string,
  amount: number,
  dueDate?: string,
): Promise<ActionResult> {
  if (!title.trim() || !amount || amount <= 0) {
    return { error: "Please enter a title and a valid amount." };
  }

  const body = `Requested milestone: "${title.trim()}" — $${amount}${dueDate ? ` (due ${dueDate})` : ""}`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.rpc("post_message", {
    p_project_id: projectId,
    p_type: "milestone_request",
    p_body: body,
  });

  if (error) return { error: error.message };

  if (user) await notifyByEmailForLatestEvent(projectId, user.id);

  revalidatePath(`/dashboard/${projectId}`);
}
