# Milestack — Technical Architecture & Production Roadmap

**Prepared for:** the founder (non-technical)
**Role of this document:** the plan a senior software architect would hand to a development team before any code is written. It describes *what* to build, *in what order*, *with which tools*, and *what it costs* — not the code itself.

---

## 0. How to read this document

You don't need to understand the code to make good decisions here. There are really only five things that matter, and the rest of the document supports them:

1. **You are building a fintech product, not a normal app.** It moves other people's money. That single fact drives the regulatory, security, and sequencing choices below. Read Section 1 first — it is the most important page.
2. **The prototype you have is a realistic-looking front end with no engine behind it.** Nothing is real yet: no accounts, no database, no money, no identity checks. That's normal and fine — it's a brilliant blueprint. Section 2 maps what exists to what's missing.
3. **There is a cheap, proven stack that comfortably handles 10,000+ users.** You will not need expensive infrastructure for a long time. Section 3 gives exact tools and costs.
4. **Payments come in Phase 2, on purpose.** Trying to handle real money on day one is the fastest way to burn cash and stall on compliance. Section 8 explains the phasing.
5. **The biggest risk is not technical — it's "who is legally allowed to hold the funds."** Solve that with a lawyer and a banking/escrow partner *before* you write payment code.

A short glossary of technical terms is at the end (Section 12). Wherever a term first appears, there's a plain-English note in *italics*.

---

## 1. The decision that shapes everything: who holds the money

Milestack's whole promise is that a client's money sits safely "in the middle" until work is approved. That holding step is **escrow**, and escrow is regulated.

**What's true in your market (Nigeria, and similar across Africa):**
- There is **no standalone "escrow licence."** Escrow services operate under the **Payment Service Provider (PSP) framework** supervised by the Central Bank of Nigeria (CBN), and the held funds must sit in a **regulated bank account**, not in your company's ordinary account.
- The established pattern (used by existing Nigerian escrow products) is a **partnership model**: a licensed partner or bank holds the funds in a dedicated escrow/settlement account, a payment gateway (e.g. Paystack) moves money in and out, and identity checks (BVN/NIN) satisfy anti-money-laundering (AML) rules.

**What this means for you, in plain terms:**

> Milestack should **never custody client funds in its own company bank account.** Instead, money should be held by a licensed partner (a bank escrow account or a PSP that supports hold-and-release), and Milestack should orchestrate the *workflow* on top. Your FAQ already promises this ("Milestack never takes custody of the money itself") — the architecture must make that literally true.

**Two viable structures:**

| Structure | How money is held | Pros | Cons | Best for |
|---|---|---|---|---|
| **A. Gateway + delayed payout** (Paystack/Flutterwave) | Funds collected by the gateway, held in your settlement balance, paid out to the freelancer on approval via the Transfers API | Fastest to build; one integration | "Holding" in your balance is a **legal grey area** — needs a lawyer's sign-off and likely a PSP relationship | Pilot / closed beta only |
| **B. Bank/partner escrow account** (recommended for scale) | Funds sit in a **dedicated, regulated escrow account** with a bank or licensed escrow partner; gateway only collects/disburses | Genuinely compliant; matches your marketing promise; can add funds insurance | More setup; partner fees; more paperwork | Public launch and beyond |

**Action (do this in parallel with Phase 1, not after):** engage a **fintech lawyer** and open conversations with **1–2 banking/escrow partners**. This is a 6–12 week lead-time item, so start early. Everything technical below is designed to plug into either structure.

---

## 2. Current prototype review

**What it is:** a single self-contained HTML/CSS/JavaScript file. It's a high-fidelity, clickable *demo* — every screen looks real, but all data is hard-coded and nothing is saved, sent, or charged. There is no server, no database, no login, and no money movement. This is exactly what a prototype should be at this stage.

**Screens already designed (a strong, complete blueprint):**

| Area | Screens in the prototype | Status | To make it real, it needs… |
|---|---|---|---|
| Marketing | Landing, pricing, FAQ | Static | Hosting + a CMS-light way to edit copy |
| Accounts | Sign up (freelancer/client), verify email, login, forgot password | Visual only | Real auth, email delivery, sessions |
| Identity | KYC / liveness screen | Visual only | KYC provider integration + storage of results |
| Onboarding | Create workspace, invite client | Visual only | Workspace + invitation backend |
| Core app | Dashboard, Workspaces, Milestones, Payments, Contracts, Messages (with calls + in-chat milestones + project codes), Files, Portfolio, Disputes, Settings | Visual only | The entire backend, database, and APIs in Section 5 |
| Public profiles | Freelancer profile, client profile | Visual only | Profile data + privacy controls |
| Admin | User management, transactions, disputes | Visual only | Admin auth + the support console (5.13) |

**Strengths:** the product logic is already well thought through — milestone statuses (draft → funded → in progress → submitted → approved → released → disputed), the 10% Project Protection Fee paid by the client, project codes for support, and the chat-as-command-centre idea. This significantly de-risks the build because the team isn't guessing what to make.

**Gaps (everything that turns a demo into a product):** authentication, a database, server-side business rules, real payments/escrow, identity verification, file storage, notifications, real-time chat and calls, an admin/support console with real powers, audit logging, and security/compliance. The rest of this document is the plan to close those gaps.

---

## 3. Recommended technology stack (cheapest credible option for 10,000+ users)

**Important framing:** 10,000 users is a *small* load for modern tools. Almost any sensible stack handles it on inexpensive infrastructure. The real cost of a SaaS is **engineering time**, not servers — so "cheapest" means *cheap to run **and** cheap to build and maintain*, with a large, affordable talent pool. That points to a **managed stack** built around React and Supabase.

### Recommended stack (Option A — managed, best value overall)

| Layer | Recommendation | Why this one | Indicative cost |
|---|---|---|---|
| **Web app (frontend)** | **Next.js (React)** | Largest developer talent pool (cheap to hire), works for web today and shares code with a future mobile app | Free (open source) |
| **Hosting (frontend)** | **Vercel** | One-click deploys, free tier for the MVP | $0 → $20/mo (Pro) |
| **Backend + Database + Auth + Storage + Realtime** | **Supabase** (managed PostgreSQL) | One platform replaces 4–5 separate services: database, login, file storage, and real-time chat. Pro tier covers up to ~100,000 users. *Realtime = live updates without refreshing, used for chat.* | $0 (free) → **$25/mo** (Pro), ~$35–75 with growth |
| **Background jobs / scheduled tasks** | **Inngest** or **Upstash QStash** | Reliable retries for payment webhooks and timed "auto-release" escrow rules. *A webhook is a message a payment provider sends you when something happens.* | Free tier → ~$20/mo |
| **Email (transactional)** | **Resend** | Verification emails, receipts, notifications | Free 3k/mo → ~$20/mo |
| **File storage at scale** | **Supabase Storage** (start) → **Cloudflare R2** (later) | R2 has no download (egress) fees, so it's the cheapest as files grow | Pennies early; cents/GB later |
| **Voice/Video calls** | **LiveKit** (cloud or self-hosted) or **Daily.co** | Real WebRTC calls with a generous free tier; only pay for minutes used | Free tier → usage-based |
| **Identity verification (KYC/AML)** | **Smile ID** (Africa-first) or **Didit** / **Dojah** | Verify NIN, BVN, ID + selfie liveness against government databases; built for Nigeria/Ghana/Kenya | Pay-per-check (~$0.08 NIN, ~$0.33 full bundle, ~$0.80 BVN); some free monthly checks |
| **Payments + payouts** | **Paystack** (primary), **Flutterwave** (fallback/pan-African) | Card/bank/USSD collection, Transfers API for payouts, BVN checks, refunds, split payments; supports the "escrow services" business type | ~1.5% + small flat fee per charge (verify current rates); transfer fees per payout |
| **Escrow custody** | **Bank/partner escrow account** (see Section 1) | Keeps you compliant and matches the brand promise | Partner-dependent |
| **Error monitoring** | **Sentry** | See and fix crashes fast | Free dev tier |
| **Product analytics** | **PostHog** | Understand usage and funnels | Free up to ~1M events/mo |
| **Domain + DNS/CDN** | **Cloudflare** | Cheap domain, free CDN, DDoS protection | ~$10–15/yr |

### Option B — absolute-cheapest infrastructure (for the cost-obsessed)

Self-host on a single **Hetzner** virtual server (~€4–6/month) running PostgreSQL + the app in Docker. The server bill is tiny and it will handle 10,000 users. **The catch:** someone has to manage backups, security patches, uptime, and scaling — that's ongoing DevOps work, which usually costs more in salary than Option A saves on hosting. **Recommendation: start on Option A.** Revisit Option B only if you have in-house DevOps and a strong reason.

### What it actually costs

| Stage | Infrastructure (monthly) | Notes |
|---|---|---|
| **Phase 1 MVP (pre-payments)** | **~$0–50** | Mostly free tiers; a domain and maybe Supabase Pro |
| **At ~10,000 users** | **~$100–300** | Supabase compute bump, Vercel Pro, email, calls, monitoring |
| **Per new verified user (one-off)** | **~$0.10–0.80** | KYC check cost, charged once at signup |
| **Per transaction** | **~1.5%+** of the charge | Payment-processor fee — largely covered by your 10% client fee |

> Bottom line: you can run the MVP for the price of a few coffees a month, and 10,000 active users for roughly the cost of one mid-range software subscription — *excluding* payment-processing fees, which scale with money moved and are mostly funded by the Project Protection Fee.

---

## 4. System architecture (high level)

### Components

```
        ┌─────────────────────────────────────────────────────────┐
        │                     USER'S BROWSER / PHONE               │
        │   Next.js (React) web app  —  the screens you designed   │
        └───────────────┬───────────────────────┬─────────────────┘
                        │ HTTPS (API calls)      │ Realtime (chat/updates)
                        ▼                         ▼
        ┌─────────────────────────────────────────────────────────┐
        │                      SUPABASE                            │
        │  Auth  │  PostgreSQL DB  │  File Storage  │  Realtime    │
        │  + Row-Level Security (data access rules in the DB)      │
        └───┬─────────┬──────────────┬───────────────┬────────────┘
            │         │              │               │
            ▼         ▼              ▼               ▼
   ┌────────────┐ ┌────────┐ ┌──────────────┐ ┌──────────────┐
   │ Background │ │ Email  │ │   Payments    │ │     KYC       │
   │ jobs       │ │(Resend)│ │ (Paystack) +  │ │ (Smile ID/    │
   │(Inngest)   │ │        │ │ Escrow account│ │  Didit)       │
   └────────────┘ └────────┘ └──────────────┘ └──────────────┘
            │                        │
            ▼                        ▼
   ┌────────────┐         ┌────────────────────┐
   │ Calls      │         │ Bank / escrow       │
   │(LiveKit)   │         │ partner (holds cash)│
   └────────────┘         └────────────────────┘
```

*In plain English:* the app talks to Supabase for everything about accounts, data, files, and live chat. Supabase (and small background workers) talk to the outside specialists — the payment gateway, the escrow account, the identity checker, the email sender, and the calls service.

### The core money flow (the "escrow loop")

1. **Set up.** Freelancer creates a project and breaks it into priced milestones. The system assigns a **project code** (e.g. `MSK-7Q4A`) for support.
2. **Fund.** Client pays *milestone amount + 10% Project Protection Fee* through Paystack. The money lands in the **escrow account** (not the freelancer's, not Milestack's). Milestone status → **funded**.
3. **Work.** Freelancer marks **in progress**, then **submits** the deliverable.
4. **Approve.** Client reviews and **approves** (or it auto-approves after a set window if the client goes silent — optional rule).
5. **Release.** The system triggers a **payout** of 100% of the milestone amount to the freelancer. Milestack keeps the 10% fee as revenue. Status → **released**.
6. **Or dispute.** If something's wrong, either side opens a **dispute**; funds stay frozen until a Milestack arbiter decides to release, refund, or split.

### Milestone state machine (the rules the backend enforces)

```
 draft ──(client funds)──▶ funded ──(freelancer starts)──▶ in_progress
   │                                                          │
   │                                                  (freelancer submits)
   │                                                          ▼
   │                                                      submitted
   │                                          ┌───────────────┼───────────────┐
   │                                 (client approves)   (client rejects)  (either disputes)
   │                                          ▼               ▼                ▼
   │                                      approved ──▶    in_progress       disputed
   │                                          │                                │
   │                                  (payout succeeds)              (arbiter decides)
   │                                          ▼                       ┌────────┼────────┐
   └──(cancel before funding)──▶ cancelled  released              released  refunded  split
```

This diagram is the single most important piece of backend logic. Every button in the app simply asks the server to move a milestone from one box to the next, and the server checks whether that move is allowed and who is allowed to make it.

---

## 5. Feature-by-feature specification

Each feature lists six things, as requested: **Frontend**, **Backend**, **Database tables**, **API endpoints**, **Security**, **Third-party services**. Endpoints are written as `METHOD /path` — *GET = read, POST = create, PATCH = update, DELETE = remove.*

### 5.1 Accounts & Authentication

- **Frontend:** sign-up (freelancer/client role toggle), login, email verification, forgot/reset password, session handling, "logged-in vs logged-out" routing.
- **Backend:** user creation, password hashing, email-verification tokens, session/refresh tokens, role assignment, rate-limited login.
- **Database tables:** `users` (id, email, password_hash, role, status, created_at), `sessions`, `email_verifications`, `password_resets`.
- **API endpoints:** `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/verify-email`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /me`.
- **Security:** hashed passwords (never stored in plain text), email verification before any money action, brute-force/rate limiting, secure http-only session cookies, optional 2-factor later.
- **Third-party:** Supabase Auth (handles most of this out of the box), Resend (emails).

### 5.2 Identity Verification (KYC / AML)

- **Frontend:** guided flow to capture government ID number (NIN/BVN), ID document photo, and a selfie liveness check; clear status screen (pending / verified / failed).
- **Backend:** start a verification "job," receive the provider's result via webhook, store pass/fail + a reference (not the raw ID images where avoidable), gate funding/payouts on "verified."
- **Database tables:** `kyc_verifications` (id, user_id, provider, status, level, checked_at, reference), `kyc_documents` (storage references, retention policy).
- **API endpoints:** `POST /kyc/start`, `POST /kyc/webhook` (provider → us), `GET /kyc/status`.
- **Security:** encrypt sensitive identity data, strict access controls, **NDPR/GDPR** consent + data-retention/erasure rules, store the *result* and *minimal* personal data rather than full document copies where possible.
- **Third-party:** **Smile ID** or **Didit/Dojah** (NIN/BVN + liveness against government databases).

### 5.3 Profiles & Portfolio

- **Frontend:** editable freelancer profile (bio, skills, rates), public profile page, portfolio gallery, client profile, verified badges, reviews/ratings display.
- **Backend:** profile CRUD, public-vs-private field control, review aggregation tied to completed funded work.
- **Database tables:** `profiles` (user_id, display_name, bio, skills, rate, avatar_url, verified), `portfolio_items`, `reviews` (rater, ratee, project_id, score, comment).
- **API endpoints:** `GET /profiles/:handle`, `PATCH /profiles/me`, `POST /portfolio`, `DELETE /portfolio/:id`, `GET /profiles/:id/reviews`, `POST /reviews`.
- **Security:** only the owner edits their profile; reviews only from real counterparties on real projects (prevents fake reviews); sanitise user text.
- **Third-party:** Supabase Storage / Cloudflare R2 (avatars, portfolio images).

### 5.4 Workspaces / Projects (with project codes)

- **Frontend:** create workspace, invite the other party by link/email, workspace list and detail, project header showing the **project code** + status.
- **Backend:** create project, generate a **unique project code** (server-side, e.g. `MSK-XXXX`), manage membership/invitations, link all milestones/messages/files to the project.
- **Database tables:** `projects` (id, code, name, client_id, freelancer_id, status, budget, created_at), `project_members`, `invitations` (token, email, role, expires_at).
- **API endpoints:** `POST /projects`, `GET /projects`, `GET /projects/:id`, `POST /projects/:id/invite`, `POST /invitations/:token/accept`.
- **Security:** project codes generated and owned by the server (never client-supplied), so support can trust them; only members can see a project (enforced in the database with Row-Level Security); invitation links expire.
- **Third-party:** Resend (invitation emails).

### 5.5 Milestones (the core engine)

- **Frontend:** create/edit milestones (title, amount, due date, deliverables), milestone list with filters by status, status pills, the action buttons (Fund / Deliver / Approve / Dispute) that change per role and status.
- **Backend:** enforce the **state machine** in Section 4 (only valid transitions, by the right role); calculate fees; emit events to payments, notifications, and the activity feed.
- **Database tables:** `milestones` (id, project_id, title, amount, currency, due_date, status, created_at), `milestone_events` (audit trail of every status change: who, when, from→to).
- **API endpoints:** `POST /milestones`, `PATCH /milestones/:id`, `POST /milestones/:id/submit`, `POST /milestones/:id/approve`, `POST /milestones/:id/reject`, `GET /projects/:id/milestones`.
- **Security:** the server — not the screen — decides if a transition is legal; every change is written to an immutable audit log; money-affecting transitions require a verified user.
- **Third-party:** none directly (it orchestrates payments in 5.7).

### 5.6 Contracts / Scope Agreements

- **Frontend:** auto-generated scope agreement from the milestones, review screen, e-signature, signed-PDF download, status (draft / awaiting signature / signed).
- **Backend:** generate the agreement document, capture signatures (name, timestamp, IP), store an immutable signed copy.
- **Database tables:** `contracts` (id, project_id, version, status, pdf_url), `contract_signatures` (contract_id, user_id, signed_at, ip).
- **API endpoints:** `POST /contracts/generate`, `POST /contracts/:id/sign`, `GET /contracts/:id`.
- **Security:** signed documents are tamper-evident and versioned; signatures are time-stamped and attributable.
- **Third-party:** a PDF generator (server-side library) — optionally a dedicated e-sign API later if you want legally heavier signatures.

### 5.7 Payments & Escrow

- **Frontend:** "Fund milestone" checkout showing amount + 10% fee, payment method selection, funding/payout status, transaction history, payout/withdraw request, escrow balance.
- **Backend:** create a charge for *amount + fee*; on success mark milestone funded; on approval trigger a **payout** of the amount to the freelancer; record every money movement; reconcile against the gateway daily; handle refunds/partials; verify all payment webhooks.
- **Database tables:** `transactions` (id, project_id, milestone_id, type [charge/payout/refund/fee], amount, currency, gateway_ref, status, created_at), `escrow_ledger` (running balance per project — the source of truth for "what's held"), `payout_accounts` (freelancer bank details, tokenised).
- **API endpoints:** `POST /payments/fund-milestone`, `POST /payments/webhook` (gateway → us), `POST /payouts/release`, `POST /payouts/request`, `GET /transactions`, `POST /payments/refund`.
- **Security:** **never store raw card data** (the gateway does, keeping you out of heavy PCI scope); verify webhook signatures; use **idempotency keys** so a retried request can't pay twice; double-entry ledger so balances always reconcile; payouts require a verified, approved milestone; segregate client funds in the escrow account.
- **Third-party:** **Paystack/Flutterwave** (collect + pay out) and the **bank/escrow partner** (custody).

### 5.8 Messaging (chat + in-chat actions)

- **Frontend:** conversation list, real-time thread, send text/attachments, in-chat milestone cards, quick actions (request/create milestone, new project), the call buttons, and the project context strip — all of which you've already designed.
- **Backend:** store and stream messages in real time, persist attachments, and let chat actions create real milestones via 5.5.
- **Database tables:** `conversations` (one per project), `messages` (id, conversation_id, sender_id, body, type [text/event/attachment], created_at), `message_attachments`.
- **API endpoints:** `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`; live delivery via Supabase Realtime.
- **Security:** only project members can read/post (database-enforced); attachments scanned/size-limited; sanitise message content.
- **Third-party:** Supabase Realtime (live messages), Storage (attachments).

### 5.9 Voice & Video Calls

- **Frontend:** the call/video buttons in the chat header, a call overlay with mute/camera/end controls (already designed), incoming-call handling.
- **Backend:** issue short-lived call "tokens," create call rooms, log call metadata (who/when/duration — not the audio/video itself).
- **Database tables:** `calls` (id, conversation_id, started_by, type [voice/video], started_at, ended_at, duration).
- **API endpoints:** `POST /calls/token`, `POST /calls/start`, `POST /calls/end`, `GET /calls?conversation_id=`.
- **Security:** call access tokens are short-lived and per-room; only project members can join; media is encrypted in transit by the provider.
- **Third-party:** **LiveKit** or **Daily.co** (the actual real-time audio/video).

### 5.10 Files & Deliverables

- **Frontend:** upload, file grid per project, preview/download, attach files to milestones as deliverables, version history.
- **Backend:** secure upload/download via time-limited links, link files to projects/milestones/messages, virus scanning.
- **Database tables:** `files` (id, project_id, milestone_id, uploader_id, name, size, mime, storage_key, version, created_at).
- **API endpoints:** `POST /files` (returns a secure upload link), `GET /files/:id` (returns a time-limited download link), `GET /projects/:id/files`, `DELETE /files/:id`.
- **Security:** files are private by default; access only via expiring signed links to project members; scan uploads; enforce size/type limits.
- **Third-party:** Supabase Storage → Cloudflare R2 at scale.

### 5.11 Disputes & Resolution

- **Frontend:** "open dispute" flow with reason + evidence upload, dispute case view with a timeline, both sides' evidence, status, and (for Milestack staff) a resolution panel.
- **Backend:** freeze the relevant funds, collect evidence from both parties, run a structured resolution workflow, execute the decision (release / refund / split) through Payments.
- **Database tables:** `disputes` (id, milestone_id, opened_by, reason, status, opened_at, resolved_at, resolution), `dispute_evidence`, `dispute_messages`.
- **API endpoints:** `POST /disputes`, `POST /disputes/:id/evidence`, `GET /disputes/:id`, `POST /disputes/:id/resolve` (staff only).
- **Security:** opening a dispute *automatically freezes the funds* server-side; only an authorised arbiter can resolve; every action audit-logged; time-boxed response windows.
- **Third-party:** Storage (evidence); ties into Payments (5.7) for the outcome.

### 5.12 Notifications

- **Frontend:** in-app notification bell/feed, notification preferences in Settings.
- **Backend:** generate notifications from key events (funded, submitted, approved, released, disputed, new message), deliver in-app + email (+ push/SMS later), respect preferences.
- **Database tables:** `notifications` (id, user_id, type, payload, read_at, created_at), `notification_preferences`.
- **API endpoints:** `GET /notifications`, `POST /notifications/:id/read`, `PATCH /notification-preferences`.
- **Security:** users only see their own notifications; no sensitive amounts leaked in email subject lines.
- **Third-party:** Resend (email); later a push service / SMS (e.g. Termii for African SMS).

### 5.13 Admin & Support Console

- **Frontend:** internal-only dashboard: look up any project **by its code**, view users/KYC status, see transactions and the escrow ledger, manage and resolve disputes, suspend accounts.
- **Backend:** privileged, heavily-audited operations separated from the normal app; project-code lookup; manual interventions with reason logging.
- **Database tables:** `admin_users`, `admin_audit_log` (every staff action: who/what/when/why), reuses the app tables in read/intervene mode.
- **API endpoints:** `GET /admin/projects/:code`, `GET /admin/users`, `POST /admin/users/:id/suspend`, `POST /admin/disputes/:id/resolve`, `GET /admin/ledger`.
- **Security:** separate admin authentication + 2-factor; least-privilege roles; **every** admin action logged immutably; ideally on a separate URL.
- **Third-party:** none required initially; can be built in the same stack.

### 5.14 Dashboard & Reporting

- **Frontend:** the freelancer/client dashboards you designed (earnings, active orders, attention items), plus simple reports/exports.
- **Backend:** aggregate balances, active orders, and activity efficiently; cache heavy queries.
- **Database tables:** none new — read-optimised **views** over existing tables.
- **API endpoints:** `GET /dashboard/summary`, `GET /dashboard/active-orders`, `GET /reports/earnings`.
- **Security:** users only see their own aggregates; numbers computed server-side from the ledger (never trust the browser for money figures).
- **Third-party:** PostHog (product analytics, separate from in-app reporting).

---

## 6. Consolidated database schema

A single coherent picture of the tables. (Primary keys and timestamps assumed on all.)

| Table | Purpose | Key relationships |
|---|---|---|
| `users` | Login + role (freelancer/client/admin) | parent of almost everything |
| `profiles` | Public/professional info | 1–1 with `users` |
| `portfolio_items`, `reviews` | Showcase + reputation | belong to `users`/`projects` |
| `kyc_verifications`, `kyc_documents` | Identity check results | belong to `users` |
| `projects` | A workspace, with its **code** | links a client + a freelancer |
| `project_members`, `invitations` | Membership + joining | belong to `projects` |
| `milestones` | Priced units of work + status | belong to `projects` |
| `milestone_events` | Audit trail of status changes | belong to `milestones` |
| `contracts`, `contract_signatures` | Scope agreements + e-signatures | belong to `projects` |
| `transactions` | Every money movement | belong to `projects`/`milestones` |
| `escrow_ledger` | Source of truth for held balances | per `project` |
| `payout_accounts` | Freelancer bank details (tokenised) | belong to `users` |
| `conversations`, `messages`, `message_attachments` | Chat | belong to `projects` |
| `calls` | Call metadata | belong to `conversations` |
| `files` | Deliverables/attachments | belong to `projects`/`milestones` |
| `disputes`, `dispute_evidence`, `dispute_messages` | Conflict resolution | belong to `milestones` |
| `notifications`, `notification_preferences` | Alerts | belong to `users` |
| `admin_users`, `admin_audit_log` | Staff + accountability | internal |

---

## 7. Security, compliance & data protection

For a money product, this is not optional polish — it's the licence to operate.

- **Authentication:** hashed passwords, email verification, secure sessions, 2-factor for admins (and optionally users) before money actions.
- **Authorisation (Row-Level Security):** access rules live *inside the database*, so a user can only ever read/write their own projects' data even if the app has a bug. *This is the single highest-leverage security control in a Supabase stack.*
- **Payments security:** card data never touches your servers (handled by the gateway → keeps you out of heavy PCI-DSS scope); verify every webhook's signature; **idempotency keys** to prevent double charges/payouts; a **double-entry ledger** so balances always reconcile and money can't "disappear."
- **KYC / AML:** verify identity (NIN/BVN + liveness) before funding or payout; keep audit trails; screen against sanctions/PEP lists as you grow.
- **Data protection (NDPR in Nigeria, GDPR if you touch the EU):** collect consent, minimise stored personal data, support data-erasure requests, define retention periods, and encrypt sensitive fields at rest.
- **Auditability:** immutable logs for every milestone transition, money movement, dispute action, and admin intervention. If a regulator or a dispute asks "what happened and when," you can answer precisely.
- **Operational security:** secrets in a secret manager (never in code), rate limiting, automated backups with tested restores, error monitoring (Sentry), and least-privilege access for staff.
- **Funds segregation:** client money sits in the regulated escrow account, strictly separate from Milestack's operating funds (this is both a legal requirement and a trust feature).

---

## 8. Development plan

A pre-phase runs in parallel from day one because of its long lead time.

### Phase 0 — Foundations (start immediately, ~ongoing, mostly non-engineering)
- Engage a **fintech lawyer**; choose your money-holding structure (Section 1); open bank/escrow + Paystack conversations; register data-protection compliance (NDPR).
- Set up the codebase, environments, and the empty Supabase project.
- **Exit criteria:** a chosen, lawyer-approved escrow structure and signed-up providers in sandbox mode.

### Phase 1 — MVP launch (the trust workflow, *no real money yet*)
- **Goal:** prove the end-to-end *workflow* and get real freelancer–client pairs using it daily.
- **In scope:** accounts + auth (5.1), basic KYC (5.2, can be "verify NIN/BVN" only), profiles (5.3), workspaces + project codes (5.4), milestones + state machine (5.5), contracts (5.6), messaging (5.8), files (5.10), notifications (5.12), dashboards (5.14), a basic admin/support console (5.13).
- **Money handling:** **simulated / manual** — milestones can be marked "funded" and "released" without live payment rails (or via a simple manual bank-transfer confirmation), so you validate behaviour without regulatory risk.
- **Deferred:** live payments, calls, advanced disputes.
- **Exit criteria:** real pairs complete real projects through the workflow; the milestone engine and permissions are solid; support can find any project by code.

### Phase 2 — Payments (turn on real money + basic escrow)
- **Goal:** clients fund milestones for real; freelancers get paid for real.
- **In scope:** Payments & escrow (5.7) with the **chosen escrow structure live**; the 10% Project Protection Fee; fund → hold → release loop; payouts; transaction history + ledger; refunds; full KYC (ID + liveness) gating funding/payouts; webhook + reconciliation jobs; basic dispute freeze (5.11 lite).
- **Third-parties activated:** Paystack/Flutterwave + bank/escrow partner + full KYC provider.
- **Exit criteria:** money flows correctly end-to-end, balances reconcile daily to the penny, and an independent test cannot double-charge or double-pay.

### Phase 3 — Advanced escrow (depth, automation, resilience)
- **Goal:** make escrow robust, fair, and scalable.
- **In scope:** full **dispute resolution** workflow with evidence + arbiter tools (5.11), partial releases and split decisions, **auto-release timers**, multi-currency, fraud/AML screening, voice/video calls (5.9), payout scheduling/retries, deeper reporting, and (if growth warrants) moving from Structure A to a fuller licensed/bank-partner Structure B with funds insurance.
- **Exit criteria:** disputes resolved inside the platform without manual database edits; escrow handles edge cases (refunds, partials, timeouts) automatically; ready to scale past 10,000 users.

---

## 9. Team, timeline & budget (for a non-technical founder)

- **Who to hire, in order:** (1) one strong **full-stack engineer** (React + Supabase/Postgres) to lead — this person can carry Phase 1; (2) a **second engineer** around Phase 2 to focus on payments/escrow; (3) **fractional/contract** help for security review and the legal/compliance side; (4) a **part-time designer** only if you outgrow the current prototype (you may not for a while — it's already strong).
- **Rough timeline (with 1–2 capable engineers):** Phase 1 ≈ 2–3 months; Phase 2 ≈ 2–3 months (gated by the legal/partner setup from Phase 0, so start that *now*); Phase 3 ≈ ongoing.
- **Rough monthly burn:** infrastructure is small (Section 3); your dominant cost is **engineering salaries/contracts**. Budget for people, not servers.
- **The cheapest accelerant** is the strong prototype you already have plus a tight, opinionated stack — both reduce engineering hours, which is where the money goes.

---

## 10. Key risks & decisions register

| # | Risk / decision | Why it matters | Recommended move |
|---|---|---|---|
| 1 | **Who legally holds the funds** | Wrong structure = regulatory shutdown | Lawyer + bank/escrow partner in Phase 0 |
| 2 | **Doing payments too early** | Burns time/cash, stalls on compliance | Keep money simulated until Phase 2 |
| 3 | **Double charge / double payout** | Direct financial loss | Idempotency keys + double-entry ledger |
| 4 | **KYC/AML gaps** | Fraud + legal exposure | Verify before any money action |
| 5 | **Data protection (NDPR/GDPR)** | Fines + lost trust | Consent, minimisation, erasure from day one |
| 6 | **Over-engineering** | Slows launch | Stick to the managed stack; resist custom infra |
| 7 | **Vendor lock-in / FX fees on tools** | Cost creep | Prefer Africa-first, Naira-priced providers where possible |

---

## 11. Immediate next steps (the first 2–3 weeks)

1. **Book a fintech lawyer** and decide the money-holding structure (Section 1). Nothing else about payments is safe to finalise until this is underway.
2. **Open sandbox accounts** with Paystack and a KYC provider (Smile ID or Didit) to confirm fit and pricing for your IDs.
3. **Hire (or contract) one strong full-stack engineer** and have them stand up the empty stack: Next.js + Supabase + Vercel.
4. **Lock the Phase 1 scope** to the workflow-only MVP above, with simulated money. Resist adding payments early.
5. **Reuse the prototype as the design spec** — hand it to the engineer as the source of truth for screens and flows.

---

## 12. Glossary (plain English)

- **Backend / server:** the part of the app users don't see, that stores data and enforces rules.
- **Database:** the organised store of all your data (PostgreSQL is the specific one recommended).
- **API / endpoint:** the "doors" the app uses to ask the server to do something (read data, fund a milestone, etc.).
- **Escrow:** money held safely by a neutral third party until conditions are met.
- **KYC / AML:** "Know Your Customer" / "Anti-Money-Laundering" — checking who someone really is, as the law requires for money services.
- **Webhook:** an automatic message a service (like Paystack) sends you when something happens (e.g. "payment succeeded").
- **Idempotency key:** a safety tag that ensures a repeated request (e.g. due to a glitch) doesn't run twice — critical so nobody is paid twice.
- **Row-Level Security (RLS):** access rules stored in the database itself, so users can only ever see their own data.
- **Realtime:** live updates pushed to the screen without refreshing (used for chat).
- **PCI-DSS:** the card-data security standard — avoided largely by letting the payment gateway handle card details.
- **NDPR / GDPR:** data-protection laws (Nigeria / EU) governing how you handle personal data.

---

*This is an architecture and implementation plan only. No application code has been written yet, by design — the structure above should be reviewed and the Phase 0 legal/partner decisions made before development begins.*
