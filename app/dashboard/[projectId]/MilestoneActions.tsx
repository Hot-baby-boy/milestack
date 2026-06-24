"use client";

import { useState } from "react";
import { transitionMilestone } from "@/lib/milestones/actions";

type Action = { label: string; status: string; variant: "primary" | "ghost" | "danger" };

function actionsFor(status: string, isFreelancer: boolean, isClient: boolean): Action[] {
  const actions: Action[] = [];
  if (status === "draft") {
    if (isClient) actions.push({ label: "Fund", status: "funded", variant: "primary" });
    if (isFreelancer) actions.push({ label: "Cancel", status: "cancelled", variant: "ghost" });
  } else if (status === "funded") {
    if (isFreelancer) actions.push({ label: "Start", status: "in_progress", variant: "primary" });
  } else if (status === "in_progress") {
    if (isFreelancer) actions.push({ label: "Submit", status: "submitted", variant: "primary" });
  } else if (status === "submitted") {
    if (isClient) {
      actions.push({ label: "Approve", status: "approved", variant: "primary" });
      actions.push({ label: "Reject", status: "in_progress", variant: "ghost" });
    }
    actions.push({ label: "Dispute", status: "disputed", variant: "danger" });
  } else if (status === "approved") {
    if (isClient) actions.push({ label: "Release", status: "released", variant: "primary" });
    actions.push({ label: "Dispute", status: "disputed", variant: "danger" });
  }
  return actions;
}

const VARIANT_CLASSES: Record<Action["variant"], string> = {
  primary: "bg-emerald-500 text-white hover:bg-emerald-600",
  ghost: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  danger: "border border-red-200 text-red-600 hover:bg-red-50",
};

export function MilestoneActions({
  milestoneId,
  projectId,
  status,
  isFreelancer,
  isClient,
}: {
  milestoneId: string;
  projectId: string;
  status: string;
  isFreelancer: boolean;
  isClient: boolean;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = actionsFor(status, isFreelancer, isClient);
  if (!actions.length) return null;

  async function act(newStatus: string) {
    setPending(newStatus);
    setError(null);
    const result = await transitionMilestone(milestoneId, projectId, newStatus);
    setPending(null);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {actions.map((a) => (
          <button
            key={a.status}
            onClick={() => act(a.status)}
            disabled={pending !== null}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold disabled:opacity-60 ${VARIANT_CLASSES[a.variant]}`}
          >
            {pending === a.status ? "…" : a.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
