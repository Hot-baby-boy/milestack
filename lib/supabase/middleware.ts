import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/auth/confirm",
  "/invite",
  "/proposal",
  "/admin/login",
  "/p/",
];

// Check for Supabase session cookie without any network call.
// Full token validation still happens in every server component via getUser().
function hasSession(request: NextRequest): boolean {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.replace("https://", "")
    .split(".")[0] ?? "";
  const cookieName = `sb-${projectRef}-auth-token`;
  return (
    request.cookies.has(cookieName) ||
    request.cookies.has("sb-access-token") ||
    // Supabase sometimes splits the token across chunks
    [...request.cookies.getAll().map(c => c.name)].some(n => n.startsWith("sb-") && n.includes("-auth-token"))
  );
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const loggedIn = hasSession(request);

  if (!loggedIn && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (loggedIn && (pathname === "/login" || pathname === "/signup")) {
    const requestedNext = request.nextUrl.searchParams.get("next");
    const safeNext =
      requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : null;
    const url = request.nextUrl.clone();
    url.search = "";
    url.pathname = safeNext ?? "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
