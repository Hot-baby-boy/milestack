# Milestack — Claude Code starter (CLAUDE.md + first prompt)

This file has two parts:
- **Part 1 — CLAUDE.md:** save this as a file named exactly `CLAUDE.md` in your project folder. Claude Code reads it automatically at the start of every session, so it always knows the rules.
- **Part 2 — First-session prompt:** paste this into the Code tab to start building.

Also put these in the same folder so Claude Code can read them: the **prototype** (the HTML file), the **Technical Roadmap**, and the **Phase 1 Build Brief**.

---
---

# PART 1 — paste this into a file called `CLAUDE.md`

```markdown
# Milestack — Project Memory

## What this is
Milestack is a trust + payments layer for freelancers and their own clients.
Freelancers bring their clients; Milestack secures the work with milestone-based
agreements and protected (escrow-style) payments. Client funds a milestone, work is
delivered and approved, then funds release. Milestack earns a 10% Project Protection
Fee paid by the client.

## Current phase
Phase 1 MVP — the workflow only, with MONEY SIMULATED (no real payments yet).

## Stack (decided — do not change without asking)
- Frontend: Next.js (React) + TypeScript
- Backend/DB/Auth/Storage/Realtime: Supabase (managed PostgreSQL)
- Hosting: Vercel
- Email: Resend. Errors: Sentry.

## Non-negotiable rules
1. MONEY IS SIMULATED in Phase 1. Put ALL money operations behind ONE payments
   service/interface (e.g. fundMilestone(), releaseMilestone()) that just writes
   ledger records and changes status. Do NOT integrate Paystack or any real payment
   provider yet. This makes Phase 2 a clean swap.
2. Row-Level Security (RLS) on EVERY table. A user must only ever access their own
   projects' data — enforced in the database, not just hidden in the UI.
3. The SERVER enforces the milestone state machine and who may make each transition.
   Never trust the browser for money figures or status changes.
4. Every milestone change, money movement, and admin action is written to an
   append-only audit log.
5. Do NOT build or ship real payments, escrow, or production security to real users
   without human expert review. Flag clearly whenever we reach such a part.
6. Reuse the existing prototype as the design/flow source of truth. Don't redesign.

## Milestone state machine
draft -> funded -> in_progress -> submitted -> approved -> released
Also: submitted -> in_progress (rejected); submitted/approved -> disputed;
draft -> cancelled. (In Phase 1, "funded" and "released" are simulated transitions.)

## Build order (one stage at a time)
1. Foundation: stack setup, auth (signup/login/verify/reset), RLS pattern, deploy to Vercel
2. Projects + project codes + invites; milestones + state machine + audit log
3. Simulated money (payments interface + ledger) + contracts/e-sign
4. Real-time chat + in-chat milestone actions + files + notifications
5. Dashboards + profiles/portfolio + basic admin/support console (lookup by code)
6. Hardening + onboard pilot users

## Reference docs (in this folder)
- Technical Roadmap: full feature specs (Section 5), DB schema (Section 6), security (Section 7)
- Phase 1 Build Brief: exact scope, acceptance criteria, build order
- Prototype (HTML): the screens and flows to match

## How to work with me (the founder is non-technical)
- Use Plan Mode for any new feature: explain the plan in plain English and wait for
  my OK before writing code.
- Ask clarifying questions before big or ambiguous changes.
- Explain what you did in simple terms after each step.
- Keep it simple. Working software over clever software.
- Never run destructive commands or touch real credentials/production without asking.
```

---
---

# PART 2 — first-session prompt (paste into the Code tab)

```
You are helping me build Milestack. Read CLAUDE.md, the Technical Roadmap, the Phase 1
Build Brief, and the prototype HTML in this folder before doing anything.

I'm a non-technical founder. Please:
1. First, in plain English, confirm you understand the project, the stack, and the
   "money is simulated in Phase 1" rule.
2. Then walk me through exactly what tools I need installed on my computer (Node.js,
   etc.) and help me install/verify them step by step.
3. Then propose a plan (Plan Mode) for STAGE 1 ONLY — the Foundation stage: set up the
   Next.js + Supabase project, basic sign-up/login with email verification, the
   Row-Level Security pattern, and deploying it to Vercel so I can open it in a browser.
4. Wait for my approval before writing any code.

Do not start on payments, escrow, or any real money handling — that's a later phase and
needs human review. Keep everything in Phase 1 with money simulated.
```

---

*Tip: after each working step, if Claude Code does something you have to correct, ask it
to "add a rule to CLAUDE.md so this doesn't happen again." Over time that file becomes
your project's memory and your sessions get faster and more accurate.*
