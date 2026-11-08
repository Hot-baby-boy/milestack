"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/Modal";
import { updateProfile } from "./actions";
import { PencilButton, SaveButton, cardClass, inputClass } from "./ui";

export function SkillsCard({ skills }: { skills: string[] }) {
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
        <h2 className="text-[20px] font-bold text-[#0F172A]">Skills and expertise</h2>
        <PencilButton onClick={() => setEditing(true)} label="Edit skills" />
      </div>
      {skills.length ? (
        <div className="flex flex-wrap gap-2.5">
          {skills.map((s) => (
            <span key={s} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[14px] font-medium text-slate-700">{s}</span>
          ))}
        </div>
      ) : (
        <p className="text-[15px] text-slate-400">Add the skills and tools you work with, like Figma, React or Copywriting.</p>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Skills and expertise">
        <form action={formAction} className="space-y-4">
          <div>
            <input name="skills" defaultValue={skills.join(", ")} className={inputClass} placeholder="UI Design, React, Figma" />
            <p className="mt-1.5 text-xs text-slate-400">Separate skills with commas.</p>
          </div>
          {state && "error" in state && <p className="text-[13px] text-red-600">{state.error}</p>}
          <SaveButton pending={pending} />
        </form>
      </Modal>
    </section>
  );
}
