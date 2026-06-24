"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await requestPasswordReset(formData);
    setPending(false);
    if (result?.error) setError(result.error);
    else setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className="text-xl font-semibold text-slate-900">Check your email</h1>
        <p className="mt-2 text-sm text-slate-500">
          If an account exists for that address, we&apos;ve sent a password reset link.
        </p>
        <Link
          href="/login"
          className="mt-5 block w-full rounded-lg bg-emerald-500 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          Back to login
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form action={onSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email address</label>
          <input
            name="email"
            type="email"
            required
            placeholder="you@email.com"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-emerald-600">
          Back to login
        </Link>
      </p>
    </>
  );
}
