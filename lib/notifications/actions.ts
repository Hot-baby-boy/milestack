"use server";

import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/email/resend";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | void;

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
}

const EMAIL_SUBJECTS: Record<string, string> = {
  new_message: "New message on Milestack",
  milestone_requested: "A milestone was requested",
  milestone_funded: "A milestone was funded",
  milestone_in_progress: "Work has started on a milestone",
  milestone_submitted: "A milestone was submitted for review",
  milestone_approved: "A milestone was approved",
  milestone_released: "A milestone was released",
  milestone_disputed: "A milestone was disputed",
  contract_signed: "Your scope agreement is fully signed",
};

// Best-effort: looks up the notification just written by a SECURITY DEFINER
// RPC (transition_milestone / sign_contract / post_message) and emails its
// recipient. Never throws — a failed lookup or email must not undo the
// action that already succeeded in the database.
export async function notifyByEmailForLatestEvent(projectId: string, actorId: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .rpc("get_latest_notification_recipient", {
        p_project_id: projectId,
        p_exclude_user: actorId,
      })
      .maybeSingle<{ email: string; type: string; payload: Record<string, unknown> }>();

    if (!data?.email) return;

    const subject = EMAIL_SUBJECTS[data.type] ?? "Update on Milestack";
    const body = `You have a new update on Milestack: ${JSON.stringify(data.payload)}`;

    await sendNotificationEmail(data.email, subject, body);
  } catch (err) {
    console.error("notifyByEmailForLatestEvent failed:", err);
  }
}
