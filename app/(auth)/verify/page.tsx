import { Suspense } from "react";
import Link from "next/link";

async function VerifyContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <Link
      href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
      className="mt-5 block w-full rounded-lg bg-emerald-500 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-600"
    >
      Go to login
    </Link>
  );
}

export default function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Check your email</h1>
      <p className="mt-2 text-sm text-slate-500">
        We sent a confirmation link to your inbox. Click it to verify your account, then log in.
      </p>
      <Suspense fallback={null}>
        <VerifyContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
