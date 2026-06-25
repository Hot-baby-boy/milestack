"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyByEmailForLatestEvent } from "@/lib/notifications/actions";

export type ActionResult = { error: string } | void;

export async function generateContract(projectId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("generate_contract", { p_project_id: projectId });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${projectId}`);
}

export async function signContract(
  contractId: string,
  projectId: string,
  signedName: string,
): Promise<ActionResult> {
  if (!signedName.trim()) {
    return { error: "Please enter your name to sign." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.rpc("sign_contract", {
    p_contract_id: contractId,
    p_signed_name: signedName.trim(),
  });

  if (error) return { error: error.message };

  if (user) await notifyByEmailForLatestEvent(projectId, user.id);

  revalidatePath(`/dashboard/${projectId}`);
}
