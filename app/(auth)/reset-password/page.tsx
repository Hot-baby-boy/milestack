"use client";

import { useState } from "react";
import { updatePassword } from "../actions";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await updatePassword(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Choose a new password</h1>
      <p className="mt-1 text-sm text-slate-500">This will replace your current password.</p>

      <form action={onSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">New password</label>
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
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </>
  );
}
