"use client";

import { useState } from "react";
import { acceptProposal } from "@/lib/talent/actions";

export function AcceptButton({ token }: { token: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    const result = await acceptProposal(token);
    // On success the server action redirects to the new workspace.
    if (result?.error) {
      setPending(false);
      setError(result.error);
    }
  }

  return (
    <>
      <button onClick={onClick} disabled={pending}
        className="rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60">
        {pending ? "Setting up…" : "Accept and start project"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </>
  );
}
