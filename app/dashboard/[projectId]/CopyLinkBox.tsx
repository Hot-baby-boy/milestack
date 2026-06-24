"use client";

import { useState } from "react";

export function CopyLinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <p className="text-xs font-medium text-emerald-800">
        Invite link created — copy and send it to your client:
      </p>
      <div className="mt-2 flex gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-md border border-emerald-300 bg-white px-2 py-1.5 text-xs text-slate-700"
        />
        <button
          onClick={copy}
          className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
