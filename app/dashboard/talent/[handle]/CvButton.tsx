"use client";

import { useState } from "react";
import { getCvDownloadUrl } from "@/lib/talent/actions";

export function CvButton({ freelancerId, cvName }: { freelancerId: string; cvName: string | null }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    // Open the tab inside the click so popup blockers allow it.
    const tab = window.open("", "_blank");
    const result = await getCvDownloadUrl(freelancerId);
    setPending(false);
    if ("error" in result) {
      tab?.close();
      setError(result.error);
      return;
    }
    if (tab) {
      tab.opener = null;
      tab.location.href = result.url;
    } else {
      window.location.href = result.url;
    }
  }

  return (
    <div>
      <button onClick={onClick} disabled={pending} title={cvName ?? undefined}
        className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-[15px] font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60">
        {pending ? "Preparing…" : "Download CV"}
      </button>
      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
