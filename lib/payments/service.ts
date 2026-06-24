"use server";

// Single payments interface per CLAUDE.md rule #1: every money operation goes
// through here. Phase 1 just forwards to the same server-enforced state
// machine that writes simulated ledger rows (see transition_milestone() in
// 0003_payments_contracts.sql). Phase 2 swaps what happens inside these two
// functions for a real Paystack charge/payout — nothing outside this file
// needs to change.

import { transitionMilestone, type ActionResult } from "@/lib/milestones/actions";

export async function fundMilestone(milestoneId: string, projectId: string): Promise<ActionResult> {
  return transitionMilestone(milestoneId, projectId, "funded");
}

export async function releaseMilestone(milestoneId: string, projectId: string): Promise<ActionResult> {
  return transitionMilestone(milestoneId, projectId, "released");
}
