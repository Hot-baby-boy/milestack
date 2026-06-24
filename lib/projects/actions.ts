"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type ActionResult = { error: string } | void;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

function generateCode() {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `MSK-${suffix}`;
}

export async function createProject(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Please enter a workspace name." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Project codes are generated here, server-side, never accepted from the client.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("projects")
      .insert({ name, code, freelancer_id: user.id })
      .select("id")
      .single();

    if (!error) redirect(`/dashboard/${data.id}`);
    if (error.code !== "23505") return { error: error.message }; // not a unique-violation, give up
  }

  return { error: "Couldn't generate a unique project code. Please try again." };
}

export async function inviteClient(formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get("projectId") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim();

  if (!projectId || !clientEmail) return { error: "Please enter the client's email." };

  const supabase = await createClient();
  const token = crypto.randomUUID();

  const { error } = await supabase.from("invitations").insert({
    project_id: projectId,
    client_email: clientEmail,
    client_name: clientName || null,
    token,
  });

  if (error) return { error: error.message };

  redirect(`/dashboard/${projectId}?invited=1&token=${token}`);
}
