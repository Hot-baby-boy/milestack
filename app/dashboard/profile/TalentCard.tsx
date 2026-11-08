"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { TalentListingForm } from "./TalentListingForm";

type Props = Parameters<typeof TalentListingForm>[0];

function Row({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 text-[14px] ${ok ? "text-slate-700" : "text-slate-400"}`}>
      <span className={`mt-[2px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
        {ok ? "✓" : ""}
      </span>
      <span>{children}</span>
    </li>
  );
}

// Right-hand card: where the freelancer stands in the Talent Space, with the
// full listing form (LinkedIn, headline, link, CV) in a pop-up.
export function TalentCard(props: Props) {
  const [open, setOpen] = useState(!!props.notice);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-[18px] font-bold text-[#0F172A]">Get found by clients</h2>
      <p className="mt-1 text-[13.5px] text-slate-500">List yourself in the Talent Space so clients can find you by category.</p>

      <ul className="mt-4 space-y-2">
        <Row ok={props.verified}>
          {props.verified ? `LinkedIn verified${props.linkedinName ? ` as ${props.linkedinName}` : ""}` : "Not verified with LinkedIn yet"}
        </Row>
        <Row ok={props.listed}>{props.listed ? "Listed in the Talent Space" : "Not listed yet"}</Row>
        <Row ok={!!props.cvName}>{props.cvName ? `CV: ${props.cvName}` : "No CV uploaded (optional)"}</Row>
      </ul>

      <button type="button" onClick={() => setOpen(true)}
        className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-emerald-600">
        {props.listed ? "Manage listing" : "Set up my listing"}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Talent Space listing" wide>
        <TalentListingForm {...props} />
      </Modal>
    </section>
  );
}
