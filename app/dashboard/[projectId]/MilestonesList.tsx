"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusPill } from "@/components/StatusPill";
import { MilestoneActions } from "./MilestoneActions";
import { NewMilestoneForm } from "./NewMilestoneForm";

type Milestone = {
  id: string;
  title: string;
  amount: number;
  due_date: string | null;
  status: string;
};

function fmtDate(due_date: string | null) {
  if (!due_date) return null;
  return new Date(due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MilestonesList({
  projectId,
  freelancerId,
  isFreelancer,
  isClient,
  initialMilestones,
}: {
  projectId: string;
  freelancerId: string;
  isFreelancer: boolean;
  isClient: boolean;
  initialMilestones: Milestone[];
}) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`milestones-${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "milestones", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const m = payload.new as Milestone;
          setMilestones(prev => [...prev, m]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "milestones", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const updated = payload.new as Milestone;
          setMilestones(prev => prev.map(m => m.id === updated.id ? updated : m));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "milestones", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const deleted = payload.old as { id: string };
          setMilestones(prev => prev.filter(m => m.id !== deleted.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  // Keep in sync when server re-renders pass new initialMilestones
  useEffect(() => {
    setMilestones(initialMilestones);
  }, [initialMilestones]);

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 className="text-[14px] font-bold text-[#0F172A] sm:text-sm">Milestones</h2>
        {isFreelancer && <div className="lg:hidden"><NewMilestoneForm projectId={projectId} /></div>}
      </div>

      {!milestones.length ? (
        <p className="px-4 py-5 text-sm text-slate-500">
          No milestones yet.{isFreelancer && " Click \"Add Milestone\" to create one."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-50">
          {milestones.map((m) => (
            <li key={m.id} className="px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-[#0F172A]">{m.title}</p>
                  <p className="mt-0.5 whitespace-nowrap font-mono text-[11px] text-slate-500 sm:text-[11.5px]">
                    ${Number(m.amount).toLocaleString()}{fmtDate(m.due_date) && <> · {fmtDate(m.due_date)}</>}
                  </p>
                </div>
                <StatusPill status={m.status} />
              </div>
              <MilestoneActions
                milestoneId={m.id}
                projectId={projectId}
                status={m.status}
                amount={Number(m.amount)}
                title={m.title}
                freelancerId={freelancerId}
                isFreelancer={isFreelancer}
                isClient={isClient}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
