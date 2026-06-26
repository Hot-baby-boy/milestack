"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProjectSearch({ defaultCode }: { defaultCode: string }) {
  const router = useRouter();
  const [code, setCode] = useState(defaultCode);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = code.trim().toUpperCase();
        if (trimmed) router.push(`/admin?code=${encodeURIComponent(trimmed)}`);
      }}
      className="flex gap-2"
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="MSK-XXXX"
        maxLength={12}
        className="w-40 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400"
      >
        Look up
      </button>
    </form>
  );
}
