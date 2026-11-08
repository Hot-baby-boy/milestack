"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { contactOnLinkedIn } from "@/lib/talent/actions";

export function ContactButton({ freelancerId }: { freelancerId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    // Open the tab right away (inside the click) so popup blockers allow it,
    // then point it at LinkedIn once the server has logged the contact.
    const tab = window.open("", "_blank");
    const result = await contactOnLinkedIn(freelancerId);
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
    router.refresh();
  }

  return (
    <div>
      <button onClick={onClick} disabled={pending}
        className="w-full rounded-xl bg-[#0A66C2] px-5 py-3 text-[15px] font-semibold text-white hover:bg-[#0958a8] disabled:opacity-60">
        {pending ? "Opening LinkedIn…" : "Contact on LinkedIn"}
      </button>
      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
