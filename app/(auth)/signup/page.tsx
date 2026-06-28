"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signup } from "../actions";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
    </svg>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [role, setRole] = useState<"freelancer" | "client">("freelancer");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const passwordMismatch = confirm.length > 0 && password !== confirm;

  async function onSubmit(formData: FormData) {
    if (password !== confirm) { setError("Passwords do not match."); return; }
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
          <button key={r} type="button" onClick={() => setRole(r)}
            className={`rounded-md py-1.5 text-sm font-medium capitalize transition ${role === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >{r}</button>
        ))}
      </div>

      <form action={onSubmit} className="mt-5 space-y-4">
        <input type="hidden" name="next" value={next} />

        <div>
          <label className="block text-sm font-medium text-slate-700">Full name</label>
          <input name="fullName" type="text" required placeholder="Tunde Adebayo"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Email address</label>
          <input name="email" type="email" required placeholder="you@email.com"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <div className="relative mt-1">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required minLength={8} placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            ><EyeIcon open={showPassword} /></button>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Minimum 8 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Confirm password</label>
          <div className="relative mt-1">
            <input
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              required placeholder="••••••••"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-1 ${
                passwordMismatch ? "border-red-400 focus:border-red-400 focus:ring-red-400" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
              }`}
            />
            <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            ><EyeIcon open={showConfirm} /></button>
          </div>
          {passwordMismatch && <p className="mt-1 text-[11px] text-red-500">Passwords do not match</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={pending || passwordMismatch}
          className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >{pending ? "Creating account…" : "Continue"}</button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-emerald-600">Log in</Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return <Suspense fallback={null}><SignupForm /></Suspense>;
}
