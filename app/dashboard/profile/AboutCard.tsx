"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/Modal";
import { updateProfile } from "./actions";
import { PencilButton, SaveButton, cardClass, inputClass } from "./ui";

export function AboutCard({ bio }: { bio: string | null }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await updateProfile(prev, formData);
      if ("success" in result) setEditing(false);
      return result;
    },
    null,
  );

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold text-[#0F172A]">About</h2>
        <PencilButton onClick={() => setEditing(true)} label="Edit about" />
      </div>
      {bio ? (
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{bio}</p>
      ) : (
        <p className="text-[15px] text-slate-400">Tell clients about yourself: what you do, who you work with, and what makes you a good fit.</p>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="About you" wide>
        <form action={formAction} className="space-y-4">
          <textarea name="bio" rows={7} defaultValue={bio ?? ""} className={inputClass}
            placeholder="Hi, I'm… I help… My work includes…" />
          {state && "error" in state && <p className="text-[13px] text-red-600">{state.error}</p>}
          <SaveButton pending={pending} />
        </form>
      </Modal>
    </section>
  );
}
