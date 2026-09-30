import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

// Paystack calls this server-to-server whenever a charge or transfer
// changes state. This — not anything the browser reports — is the source
// of truth for real money moving. Every write here goes through the
// service-role client, since there is no browser session to authenticate
// as; the SQL functions it calls (fund_milestone_from_payment etc.) are
// the only things allowed to use it.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const supabase = createAdminClient();

  try {
    switch (event.event) {
      case "charge.success": {
        const reference = event.data.reference as string;
        const { error } = await supabase.rpc("fund_milestone_from_payment", { p_reference: reference });
        if (error) throw error;
        break;
      }
      case "transfer.success": {
        const reference = event.data.reference as string;
        const { error } = await supabase.rpc("release_milestone_from_transfer", { p_reference: reference });
        if (error) throw error;
        break;
      }
      case "transfer.failed":
      case "transfer.reversed": {
        const reference = event.data.reference as string;
        const { error } = await supabase.rpc("fail_payment_intent", { p_reference: reference });
        if (error) throw error;
        break;
      }
      default:
        // Ignore events we don't act on (e.g. charge.failed — the client
        // just sees the Paystack popup's own failure message and can retry).
        break;
    }
  } catch (err) {
    // Log and still return 200 for an already-processed/idempotent case;
    // Paystack retries on non-2xx, which would just repeat a real failure.
    console.error("Paystack webhook handling error:", err);
  }

  return NextResponse.json({ received: true });
}
