"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "../actions";

export default function SignupPage() {
  const [role, setRole] = useState<"freelancer" | "client">("freelancer");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    formData.set("role", role);
    const result = await signup(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Set up your workspace in under five minutes.</p>

      <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        {(["freelancer", "client"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-md py-1.5 text-sm font-medium capitalize transition ${
              role === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <form action={onSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Full name</label>
          <input
            name="fullName"
            type="text"
            required
            placeholder="Tunde Adebayo"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
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
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
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
          {pending ? "Creating account…" : "Continue"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-600">
          Log in
        </Link>
      </p>
    </>
  );
}
