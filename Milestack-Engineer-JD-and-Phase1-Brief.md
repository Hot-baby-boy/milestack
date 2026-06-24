# Milestack — Founding Engineer: Job Description + Phase 1 Build Brief

**Two documents in one file:**
- **Part A — Job Description** is written to be copied straight onto a job board or sent to candidates. It also includes a *"How to evaluate candidates"* section for you, since you're non-technical.
- **Part B — Phase 1 Build Brief** is the spec your hired engineer builds from. Hand it to them on day one, together with the prototype file and the technical roadmap.

---
---

# PART A — Job Description (ready to post)

## Founding Full-Stack Engineer — Milestack

**Location:** Remote (overlap with West Africa Time preferred)
**Type:** Full-time or contract-to-hire
**Compensation:** [you fill in — see the founder note below]

### About Milestack
Milestack is a trust and payments layer for freelancers and their clients. Freelancers bring their own clients; Milestack secures the relationship with milestone-based agreements and protected (escrow-style) payments, so freelancers get paid for delivered work and clients only pay for what they approve. We're early, we have a complete, high-fidelity product prototype, and we're hiring our founding engineer to build the real thing.

### The role
You'll be the first engineer and own the MVP end-to-end. We have a fully designed clickable prototype and a detailed technical roadmap — your job is to turn that blueprint into a working product, starting with the core workflow (accounts, projects, milestones, messaging) before we switch on live payments. You'll work directly with the founder and have real ownership of architecture and delivery.

### What you'll do
- Build the Milestack web app from an existing prototype and written spec.
- Stand up the backend, database, authentication, and security from scratch on a modern managed stack.
- Implement the milestone "state machine" — the rules that move work from draft → funded → in progress → submitted → approved → released.
- Build real-time chat, file handling, dashboards, and a basic internal admin/support console.
- Design the system so that real payments and escrow can be added cleanly in the next phase.
- Make sensible, pragmatic decisions and ship — we value working software over perfect software.

### Our stack (what you'll use)
- **Frontend:** Next.js (React) + TypeScript
- **Backend / DB / Auth / Storage / Realtime:** Supabase (managed PostgreSQL)
- **Hosting:** Vercel
- **Later phases:** Paystack/Flutterwave (payments), Smile ID/Didit (identity), LiveKit/Daily (calls)

### Must-have
- Shipped at least one real product end-to-end (not just tutorials or course projects).
- Strong with React/Next.js and TypeScript.
- Comfortable with PostgreSQL and a backend (Supabase experience is a big plus).
- Understands authentication, sessions, and securing data properly.
- Can explain technical decisions in plain language to a non-technical founder.
- Works independently, communicates proactively, and ships.

### Nice-to-have
- Experience with payments, fintech, escrow, or KYC.
- Real-time features (chat, presence) and webhooks.
- Familiarity with the African payments landscape (Paystack/Flutterwave) and identity (BVN/NIN).

### What success looks like in your first 90 days
- Real freelancer–client pairs complete real projects through the Milestack workflow.
- The milestone engine and permissions are solid and secure.
- The codebase is clean and structured so payments can be added next without a rewrite.

### How to apply
Send: (1) a short note on a product you built and your exact role in it, (2) links to live work or code, (3) your availability and compensation expectations. Strong candidates may be invited to a short paid trial task.

---

### 🔒 Founder note (remove before posting)
- **Compensation:** rates vary enormously by location and seniority (a senior local hire in Lagos vs. a global-remote senior are very different markets). Set a range you can sustain, decide your cash-vs-equity split for a founding hire, and research current market rates before posting — don't guess. A contract-to-hire trial (e.g. 2–4 weeks paid) lowers your risk on the first hire.
- **Where to post:** local tech communities and job boards, engineering Slack/Discord groups, your network and referrals (best signal), and remote-Africa job boards.
- **One hire, not a team:** for Phase 1 you want *one* strong generalist, not several specialists. A second engineer comes in around Phase 2 (payments).

---

### How to evaluate candidates (for a non-technical founder)
You can't judge code, but you *can* judge thinking and communication. Ask these and listen for the patterns below.

| Ask them… | 🟢 Good signal | 🔴 Red flag |
|---|---|---|
| "Walk me through a product you shipped and what *you* personally did." | Specific, owns concrete parts, mentions trade-offs | Vague, only group/course projects, can't separate their role |
| "How would you build 'fund a milestone' if there's no real money yet, but we'll add real payments later?" | Talks about a ledger/record and a clean swap later; keeps it simple | Wants to build full payment infrastructure now, or has no plan for later |
| "How do you make sure one user can't see another user's private project data?" | Mentions securing data at the database level (e.g. Supabase Row-Level Security), not just hiding it in the app | "We just won't show it in the UI" |
| "We have a finished prototype — how would you use it?" | Treats it as the spec, reuses it, respects the work | Wants to redesign everything from scratch first |
| "Explain [any technical choice] like I'm not technical." | Clear, patient, analogy-friendly | Jargon, impatience, makes you feel small |

**Also valuable:** a small **paid trial task** (a day or two) tells you more than any interview — e.g. "set up login + create a project + list projects on our stack." You're checking: do they ship, is it clean, do they communicate, do they ask good questions.

---
---

# PART B — Phase 1 Build Brief (for the hired engineer)

> Read alongside the two attachments: the **clickable prototype** (the design + flow source of truth) and the **Milestack Technical Roadmap** (full feature specs in Section 5, schema in Section 6, security in Section 7). This brief defines exactly what Phase 1 includes and how to build it so Phase 2 (payments) drops in cleanly.

## 1. Objective
Ship a working MVP that lets a real freelancer and a real client run a project through the full workflow — **with money simulated, not live.** The goal is to validate the workflow and the milestone engine with real users before we integrate payments and escrow.

## 2. Stack (decided — please don't re-litigate for Phase 1)
- Next.js (React) + TypeScript, hosted on Vercel.
- Supabase: PostgreSQL, Auth, Storage, Realtime.
- **Row-Level Security (RLS) on every table** — data access enforced in the database, not just the UI.
- Background jobs (Inngest or Upstash QStash) only where needed (e.g. invitation expiry, notification fan-out).
- Resend for transactional email. Sentry for error monitoring.

## 3. In scope for Phase 1
1. **Accounts & auth** — signup (freelancer/client role), email verification, login, password reset, sessions.
2. **Identity (lite)** — capture and verify a NIN/BVN via the provider's basic check; store pass/fail. (Full ID + liveness is Phase 2.)
3. **Profiles & portfolio** — editable profile, public profile page, portfolio items.
4. **Workspaces / projects** — create a project, server-generated **project code** (e.g. `MSK-XXXX`), invite the other party by link/email, membership.
5. **Milestones** — create/edit priced milestones; implement the **state machine** in Section 5; every transition written to an audit log.
6. **Contracts** — generate a scope agreement from the milestones; simple e-signature (name + timestamp); store a signed copy.
7. **Messaging** — real-time chat per project, attachments, in-chat milestone actions (create/request milestone, new project), project context strip. (Calls are Phase 3 — leave the buttons as no-ops or hidden.)
8. **Files** — upload/download via secure expiring links, attach as deliverables.
9. **Notifications** — in-app feed + email for key events (funded, submitted, approved, released, new message).
10. **Dashboards** — freelancer/client dashboards (earnings, active orders, attention items) computed server-side.
11. **Admin/support console (basic)** — look up any project **by code**, view users/KYC status, suspend an account; every admin action logged.

## 4. Explicitly OUT of scope for Phase 1 (do not build yet)
- Live payments, real payouts, real escrow custody → **Phase 2.**
- Voice/video calls → **Phase 3.**
- Advanced dispute resolution (evidence engine, arbiter tooling, partial/split releases) → **Phase 3.** (A simple "flag/dispute" status that freezes a milestone is enough for now.)
- Multi-currency, fraud/AML screening, auto-release timers → later phases.

## 5. The milestone state machine (most important logic)
The server — not the UI — decides whether a transition is allowed and which role may perform it. Every transition is appended to an audit log (`milestone_events`).

```
 draft ──(client funds*)──▶ funded ──(freelancer starts)──▶ in_progress
   │                                                          │
   │                                                  (freelancer submits)
   │                                                          ▼
   │                                                      submitted
   │                                          ┌───────────────┼───────────────┐
   │                                 (client approves)   (client rejects)  (either flags)
   │                                          ▼               ▼                ▼
   │                                      approved ──▶    in_progress       disputed
   │                                          │
   │                                  (release* succeeds)
   │                                          ▼
   └──(cancel before funding)──▶ cancelled  released
```
**\* In Phase 1, "fund" and "release" are simulated** — see next section.

## 6. How to simulate money (so Phase 2 is a clean swap)
- Treat "fund a milestone" and "release a milestone" as **state transitions plus ledger entries**, not real charges.
- Record every simulated movement in a `transactions` / `escrow_ledger` table exactly as if it were real (type, amount, status, project, milestone), just with `gateway = "simulated"`.
- Put all money operations behind a single **payments service/interface** with methods like `fundMilestone()` and `releaseMilestone()`. In Phase 1 that service writes ledger rows and flips status. In Phase 2 we replace its internals with Paystack + the escrow account — **without touching the rest of the app.**
- This single decision is what makes Phase 2 fast instead of a rewrite. Please get it right.

## 7. Non-functional requirements
- **Security:** RLS on all tables; email-verified users only for sensitive actions; audit logs for milestone, money (simulated), and admin actions; secrets in environment/secret storage, never in code.
- **Responsive:** the prototype already works well on mobile — preserve that; the messaging single-pane mobile pattern is part of the spec.
- **Reliability:** automated database backups on; Sentry wired up from week one.
- **Clarity:** keep the data model close to Section 6 of the roadmap so future engineers can read it.

## 8. Suggested build order
This is a guide, not a contract — adjust as you learn.

| Stage | Focus | Done when… |
|---|---|---|
| **1. Foundation** | Stack set up, auth, RLS pattern, deploy pipeline | A user can sign up, verify, log in; data is RLS-protected; app deploys to Vercel |
| **2. Projects & milestones** | Projects + codes + invites; milestone state machine + audit log | Two users share a project; milestones move through all valid states server-side |
| **3. Money (simulated) & contracts** | Payments interface (simulated) + ledger; scope agreement + e-sign | A milestone can be "funded" and "released" as ledger entries; an agreement can be signed |
| **4. Collaboration** | Real-time chat, in-chat actions, files, notifications | Two users chat live, attach files, create milestones from chat, get notified |
| **5. Surfaces & admin** | Dashboards, profiles/portfolio, basic admin/support console | Dashboards show real data; staff can find a project by code and act |
| **6. Hardening & pilot** | Bug-fix, polish, onboard pilot users | Real pilot pairs complete a project end-to-end |

## 9. Definition of done (Phase 1 exit criteria)
- Real freelancer–client pairs can complete a real project through the entire workflow (with simulated money).
- The milestone engine enforces valid transitions and the correct roles, with a full audit trail.
- Data is secure: users only ever access their own projects' data (verified at the database level).
- Support can locate any project by its code and take basic actions.
- All money logic sits behind the payments interface, ready for Phase 2 to make it real.

## 10. What to hand the engineer with this brief
1. The **clickable prototype** file (design + flows = source of truth for screens).
2. The **Milestack Technical Roadmap** (Section 5 = full feature specs, Section 6 = schema, Section 7 = security).
3. This brief.
4. Access to: Supabase, Vercel, Resend, Sentry, and the domain.

---

*No application code is included here by design. This is the hiring + scoping package; coding begins once the engineer is on board and Phase 1 scope is confirmed.*
