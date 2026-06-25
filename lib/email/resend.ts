import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Best-effort only: a failed email must never block the underlying
// action (e.g. funding a milestone still succeeds even if this fails).
// Without a verified sending domain, Resend can only deliver to the
// address you signed up with — that's a platform limit, not a bug here.
export async function sendNotificationEmail(to: string, subject: string, body: string) {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: "Milestack <onboarding@resend.dev>",
      to,
      subject,
      text: body,
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}
