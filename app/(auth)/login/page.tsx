"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "../actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await login(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Log in to your workspaces.</p>

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
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <Link href="/forgot-password" className="text-sm font-medium text-emerald-600">
              Forgot?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        New to Milestack?{" "}
        <Link href="/signup" className="font-medium text-emerald-600">
          Create an account
        </Link>
      </p>
    </>
  );
}
