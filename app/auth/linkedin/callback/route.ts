import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Landing point after a logged-in freelancer links their LinkedIn account.
// The verified name and member id come from the identity LinkedIn gave
// Supabase — never from anything the browser sends — and are written with
// the service-role client because the profiles table blocks users from
// setting these columns on themselves.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const done = (status: string, message?: string) => {
    const url = new URL("/dashboard/profile", origin);
    url.searchParams.set("linkedin", status);
    if (message) url.searchParams.set("msg", message);
    return NextResponse.redirect(url);
  };

  const providerError = searchParams.get("error_description");
  if (providerError) return done("error", providerError);

  const supabase = await createClient();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return done("error", error.message);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin));

  const identity = user.identities?.find((i) => i.provider === "linkedin_oidc");
  if (!identity) return done("error", "LinkedIn did not return an identity. Please try again.");

  const data = (identity.identity_data ?? {}) as Record<string, unknown>;
  const sub = String(data.sub ?? data.provider_id ?? identity.identity_id ?? "");
  const name = String(
    data.name ?? data.full_name ?? [data.given_name, data.family_name].filter(Boolean).join(" "),
  ).trim();
  if (!sub || !name) return done("error", "LinkedIn did not share your name. Please try again.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      linkedin_sub: sub,
      linkedin_name: name,
      linkedin_verified_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return done("error", "That LinkedIn account is already linked to another Milestack account.");
    }
    return done("error", error.message);
  }

  return done("verified");
}
