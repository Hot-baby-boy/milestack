"use client";

import Link from "next/link";
import { useState } from "react";

const LogoMark = () => (
  <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-gradient-to-br from-slate-700 to-slate-900 flex-shrink-0">
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
      <polyline points="6,22 11,10 16,20 21,8 26,20" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="22" r="1.8" fill="#10B981"/>
      <circle cx="11" cy="10" r="1.8" fill="#10B981"/>
      <circle cx="16" cy="20" r="1.8" fill="#10B981"/>
      <circle cx="21" cy="8" r="1.8" fill="#10B981"/>
      <circle cx="26" cy="20" r="1.8" fill="#10B981"/>
    </svg>
  </span>
);

const CheckIcon = () => (
  <svg className="h-[17px] w-[17px] text-emerald-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
);

const FAQ_ITEMS = [
  { q: "Is Milestack a marketplace?", a: "No. You bring your own clients from wherever you already work — LinkedIn, referrals, WhatsApp, email, or anywhere else. Milestack only handles the trust and payment layer once you've already agreed to work together." },
  { q: "How does escrow actually work?", a: "Your client deposits milestone funds through our payment partner before work begins. Funds stay held until the client approves the milestone, then release directly to you with no manual transfer needed." },
  { q: "Does Milestack hold my money?", a: "No. Milestack doesn't custody funds directly. Payments run through regulated payment infrastructure, so funds sit with licensed financial partners, not with Milestack itself." },
  { q: "What happens if a client and freelancer disagree?", a: "Either side can open a case in the Dispute Center with evidence, files, and chat history attached. Our resolution team reviews the milestone and makes a binding decision on the funds in escrow." },
  { q: "Do I need to verify my identity?", a: "Yes. Both freelancers and clients complete a one-time identity verification before funding or receiving any payments." },
  { q: "What does Milestack cost?", a: "Milestack is free for freelancers to join — you keep 100% of every project you complete. Clients pay a 10% Project Protection Fee on top of the project amount when they fund a workspace. On a $1,000 project, the client pays $1,100 total, and you receive the full $1,000." },
  { q: "Why do clients pay the fee instead of freelancers?", a: "We wanted freelancers to keep every dollar they earn, so the cost of running Milestack's protection — escrow, identity verification, fraud prevention, milestone management, and dispute resolution — is built into what the client pays, not deducted from your payout." },
  { q: "What's the Verified Freelancer Membership?", a: "It's an optional $5/month upgrade for freelancers. It adds a verified badge on your public profile, unlimited client workspaces, a professional portfolio profile, and priority support." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left text-base font-semibold text-slate-900"
      >
        {q}
        <span className={`ml-4 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-slate-500 transition-transform ${open ? "rotate-45 border-emerald-500 text-emerald-600" : ""}`}>
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 1v10M1 6h10"/></svg>
        </span>
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed text-slate-500 max-w-2xl">{a}</p>}
    </div>
  );
}

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Workspace Overview" },
    { id: "milestones", label: "Milestone Management" },
    { id: "payments", label: "Payment Tracking" },
    { id: "chat", label: "Team Collaboration" },
    { id: "files", label: "File Uploads" },
    { id: "approval", label: "Client Approval" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* ── NAV ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-white/80 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900">
            <LogoMark />
            Milestack
          </Link>
          <div className="hidden items-center gap-9 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-500 hover:text-slate-900">Product</a>
            <a href="#how" className="text-sm font-medium text-slate-500 hover:text-slate-900">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-slate-900">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-slate-500 hover:text-slate-900">Security</a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="text-sm font-semibold text-slate-700 px-2 hover:text-slate-900">Log in</Link>
            <Link href="/signup" className="rounded-[10px] bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors">Start a Workspace</Link>
          </div>
          <button onClick={() => setNavOpen(!navOpen)} className="flex flex-col gap-1.5 p-1 md:hidden">
            <span className="block h-0.5 w-6 bg-slate-900 rounded"></span>
            <span className="block h-0.5 w-6 bg-slate-900 rounded"></span>
            <span className="block h-0.5 w-6 bg-slate-900 rounded"></span>
          </button>
        </div>
        {navOpen && (
          <div className="border-t border-slate-200 bg-white px-6 py-5 flex flex-col gap-4 md:hidden shadow-lg">
            <a href="#features" className="text-base font-medium text-slate-600" onClick={() => setNavOpen(false)}>Product</a>
            <a href="#how" className="text-base font-medium text-slate-600" onClick={() => setNavOpen(false)}>How it works</a>
            <a href="#pricing" className="text-base font-medium text-slate-600" onClick={() => setNavOpen(false)}>Pricing</a>
            <a href="#faq" className="text-base font-medium text-slate-600" onClick={() => setNavOpen(false)}>Security</a>
            <div className="flex flex-col gap-2.5 pt-2">
              <Link href="/login" className="rounded-[10px] border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700">Log in</Link>
              <Link href="/signup" className="rounded-[10px] bg-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-white">Start a Workspace</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-[170px] pb-[110px]" style={{background:"radial-gradient(1000px 560px at 80% -12%, rgba(16,185,129,0.18), transparent 62%), radial-gradient(760px 480px at -4% 8%, rgba(15,23,42,0.07), transparent 60%), linear-gradient(165deg,#FFFFFF 0%,#FBFDFD 50%,#F2FAF6 100%)"}}>
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:"linear-gradient(to right, rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.035) 1px, transparent 1px)", backgroundSize:"48px 48px", maskImage:"radial-gradient(700px 500px at 70% 10%, rgba(0,0,0,0.7), transparent 75%)"}}/>
        <div className="relative mx-auto max-w-[1180px] px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"/>
                For freelancers who bring their own clients
              </div>
              <h1 className="mb-6 text-5xl font-bold leading-[1.06] tracking-tight text-slate-900 lg:text-[70px]">
                Found A Client?<br/>
                <span className="bg-gradient-to-r from-emerald-700 to-emerald-400 bg-clip-text text-transparent">We&apos;ll Secure The Deal.</span>
              </h1>
              <p className="mb-9 max-w-md text-lg leading-relaxed text-slate-500">Protect payments, track milestones, and get paid with confidence.</p>
              <div className="mb-7 flex flex-wrap gap-4">
                <Link href="/signup" className="rounded-[10px] bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-600 transition-colors">Start a Workspace</Link>
                <a href="#how" className="flex items-center gap-2 rounded-[10px] border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  See How It Works
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-400">
                <div className="flex">
                  {["TA","WO","LM"].map((i,n) => (
                    <span key={i} className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-slate-700 to-slate-900 font-mono text-[9px] font-bold text-white" style={{marginLeft: n === 0 ? 0 : -8}}>{i}</span>
                  ))}
                </div>
                Trusted by freelancers and clients in 30+ countries
              </div>
            </div>

            {/* Visual */}
            <div className="relative h-[420px] lg:h-[480px]">
              {[
                { title:"Launch Support", amount:"$800.00", pill:"RELEASED", pillCls:"bg-emerald-50 text-emerald-700", iconBg:"#ECFDF5", icon:<path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2"/>, top:0, delay:"0s" },
                { title:"Final Build", amount:"$3,000.00", pill:"APPROVED", pillCls:"bg-blue-50 text-blue-700", iconBg:"#EFF6FF", icon:<><path d="M9 12l2 2 4-4" stroke="#2563EB" strokeWidth="2"/><circle cx="12" cy="12" r="9" stroke="#2563EB" strokeWidth="2"/></>, top:108, delay:"1.2s" },
                { title:"Wireframes", amount:"$1,200.00", pill:"IN PROGRESS", pillCls:"bg-orange-50 text-orange-700", iconBg:"#FFF7ED", icon:<><circle cx="12" cy="12" r="9" stroke="#C2660D" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="#C2660D" strokeWidth="2"/></>, top:216, delay:"2.1s" },
                { title:"Discovery Call", amount:"$500.00", pill:"FUNDED", pillCls:"bg-slate-100 text-slate-600", iconBg:"#F1F5F9", icon:<><rect x="4" y="10" width="16" height="10" rx="2" stroke="#334155" strokeWidth="2"/><path d="M8 10V7a4 4 0 018 0v3" stroke="#334155" strokeWidth="2"/></>, top:324, delay:"0.6s" },
              ].map((c) => (
                <div key={c.title} className="absolute left-0 w-full" style={{top:c.top, animation:`floaty 6s ease-in-out infinite`, animationDelay:c.delay}}>
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px]" style={{background:c.iconBg}}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">{c.icon}</svg>
                      </div>
                      <div>
                        <div className="text-[13.5px] font-semibold text-slate-900">{c.title}</div>
                        <div className="font-mono text-[12px] text-slate-400">{c.amount}</div>
                      </div>
                    </div>
                    <span className={`rounded-full font-mono text-[11px] font-semibold px-2.5 py-1 ${c.pillCls}`}>{c.pill}</span>
                  </div>
                </div>
              ))}
              <div className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 shadow-2xl" style={{animation:"pulseglow 3.4s ease-in-out infinite"}}>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
                </div>
                <div>
                  <div className="font-mono text-[10.5px] tracking-widest text-slate-400">SECURED IN ESCROW</div>
                  <div className="font-mono text-base font-bold text-white">$4,500.00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
          @keyframes pulseglow { 0%,100%{box-shadow:0 16px 40px rgba(15,23,42,0.28),0 0 0 0 rgba(16,185,129,0.25)} 50%{box-shadow:0 16px 40px rgba(15,23,42,0.28),0 0 0 8px rgba(16,185,129,0)} }
        `}</style>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="bg-slate-900 py-6">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {[
              { icon:<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z"/>, label:"Secure Escrow" },
              { icon:<><circle cx="12" cy="8" r="3"/><path d="M5 21c0-4 3-6 7-6s7 2 7 6"/><path d="M3 11l1.5 1.5L7 10"/></>, label:"Identity Verification" },
              { icon:<><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 14h4"/></>, label:"Protected Payments" },
              { icon:<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 010 18 13 13 0 010-18z"/></>, label:"Global Collaboration" },
              { icon:<path d="M12 3l2 5 5 .8-3.6 3.5.9 5-4.3-2.4-4.3 2.4.9-5L5 8.8 10 8z"/>, label:"Dispute Resolution" },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2.5 text-sm font-medium text-slate-300">
                <svg className="h-4 w-4 flex-shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{t.icon}</svg>
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEY MESSAGE ── */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-emerald-50 to-white py-14 text-center">
        <div className="mx-auto max-w-[1180px] px-6">
          <h2 className="mb-2.5 text-3xl font-bold tracking-tight text-slate-900">
            You found the client.{" "}
            <span className="bg-gradient-to-r from-emerald-700 to-emerald-400 bg-clip-text text-transparent">Keep every dollar you earn.</span>
          </h2>
          <p className="text-base text-slate-500">Clients pay for protection. Freelancers keep 100% of their project earnings.</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="bg-gradient-to-b from-slate-50 to-white py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto mb-16 max-w-[640px] text-center">
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>The workflow
            </div>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">From invite to payout, in six steps</h2>
            <p className="text-lg text-slate-500">Every workspace follows the same trusted sequence, so both sides always know exactly where the money and the work stand.</p>
          </div>
          <div className="relative mx-auto max-w-[760px]">
            <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 to-slate-200"/>
            {[
              { n:"01", title:"Invite Your Client", body:"Send a workspace link by email, WhatsApp, LinkedIn, or any channel you already use. No marketplace account required on either side." },
              { n:"02", title:"Create Milestones", body:"Break the project into clear, priced milestones with deadlines, deliverables, and scope — set once, visible to both sides." },
              { n:"03", title:"Client Funds Project", body:"Your client deposits the milestone amount plus a 10% Project Protection Fee into escrow before work begins. You receive 100% of the agreed amount." },
              { n:"04", title:"Deliver Work", body:"Upload files, share progress, and message your client inside the workspace — one shared record for the whole project." },
              { n:"05", title:"Client Approves", body:"Your client reviews the deliverable against the milestone and approves it, or requests changes with specific feedback." },
              { n:"06", title:"Payment Released", body:"Funds release straight to your account the moment a milestone is approved. No invoices to chase, no waiting on \"payment sent.\"" },
            ].map((s, i) => (
              <div key={s.n} className={`relative flex gap-6 ${i < 5 ? "pb-12" : ""}`}>
                <div className="relative z-10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 font-mono text-sm font-bold text-white shadow-[0_8px_20px_rgba(16,185,129,0.28),0_0_0_5px_#F8FAFC]">{s.n}</div>
                <div className="pt-2">
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="max-w-[480px] text-[15.5px] leading-relaxed text-slate-500">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-16 max-w-[640px]">
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Everything the relationship needs
            </div>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">Built for work between two people who already trust each other, mostly</h2>
            <p className="text-lg text-slate-500">Milestack handles the parts that get awkward: money, proof of delivery, and what happens when something goes wrong.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Big card */}
            <div className="group col-span-1 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-7 sm:col-span-2 lg:row-span-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-emerald-500/20">
                <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-white">Escrow Payments</h3>
              <p className="text-[15px] leading-relaxed text-slate-400">Clients fund milestones through regulated payment infrastructure, paying the project amount plus a 10% Project Protection Fee. Freelancers receive 100% of the agreed amount — Milestack never takes a cut of your earnings.</p>
              <div className="mt-auto flex flex-wrap gap-2">
                {["Freelancer keeps 100%","Held until approval","Fee paid by client"].map(t => (
                  <span key={t} className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-slate-200">{t}</span>
                ))}
              </div>
            </div>
            {[
              { icon:<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>, title:"Milestone Tracking", body:"Every deliverable has a status visible to both sides at all times — draft, funded, in progress, submitted, approved, or released." },
              { icon:<><path d="M14 3v4a1 1 0 001 1h4"/><path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/><path d="M9 13h6M9 17h6"/></>, title:"Contracts & Agreements", body:"Generate a scope-of-work agreement from your milestones and have both parties sign before any money moves." },
              { icon:<path d="M21 11.5a8.5 8.5 0 11-3.8-7.1"/>, title:"Project Chat", body:"One thread per workspace, attached to the milestone it's about. No more digging through WhatsApp for the brief." },
              { icon:<><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></>, title:"File Sharing", body:"Drafts, revisions, and final deliverables live inside the milestone they belong to, version by version." },
              { icon:<><circle cx="12" cy="8" r="3"/><path d="M5 21c0-4 3-6 7-6s7 2 7 6"/><path d="M3 11l1.5 1.5L7 10"/></>, title:"Identity Verification", body:"Government ID, selfie liveness check, and address verification keep every workspace tied to a real, accountable person." },
              { icon:<path d="M12 3l2 5 5 .8-3.6 3.5.9 5-4.3-2.4-4.3 2.4.9-5L5 8.8 10 8z"/>, title:"Dispute Resolution", body:"If a milestone is contested, either side can open a case with evidence and chat history for a binding review." },
              { icon:<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></>, title:"Portfolio Profiles", body:"A public profile with verified work history, completed projects, and client reviews — built from real, funded work." },
            ].map((f) => (
              <div key={f.title} className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-emerald-50">
                  <svg className="h-5 w-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{f.icon}</svg>
                </div>
                <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-14 max-w-[640px]">
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Who it&apos;s for
            </div>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">Built for independent work, whatever shape it takes</h2>
            <p className="text-lg text-slate-500">If you bring your own clients and bill by the project, Milestack fits how you already work.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon:<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/></>, title:"Freelancers", body:"Independent talent working project to project, direct with clients." },
              { icon:<><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></>, title:"Designers", body:"Brand, product, and graphic designers shipping client deliverables." },
              { icon:<path d="M8 6L2 12l6 6M16 6l6 6-6 6"/>, title:"Developers", body:"Engineers building sites, apps, and integrations for direct clients." },
              { icon:<path d="M17 3a2.8 2.8 0 114 4L7 21l-4 1 1-4z"/>, title:"Writers", body:"Copywriters, ghostwriters, and content creators working by the brief." },
              { icon:<><rect x="4" y="9" width="16" height="12" rx="1"/><path d="M9 22V13M9 4h6v5H9z"/></>, title:"Agencies", body:"Small teams running multiple client engagements at once." },
              { icon:<><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></>, title:"Consultants", body:"Advisors billing for milestone-based engagements and retainers." },
              { icon:<><circle cx="12" cy="12" r="9"/><path d="M16 8l-5 3-2 5 5-3 2-5z"/></>, title:"Architects", body:"Spatial and structural designers managing phased project payments." },
              { icon:<path d="M3 11l18-7-7 18-3-7-8-4z"/>, title:"Marketing Pros", body:"Strategists and freelance marketers running campaign-based work." },
            ].map((a) => (
              <div key={a.title} className="group flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md">
                <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-slate-50 transition group-hover:bg-emerald-50">
                  <svg className="h-5 w-5 text-slate-700 transition group-hover:text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{a.icon}</svg>
                </div>
                <h4 className="text-[15.5px] font-bold text-slate-900">{a.title}</h4>
                <p className="text-[13px] leading-relaxed text-slate-500">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto mb-16 max-w-[640px] text-center">
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Inside the workspace
            </div>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">One workspace. Every part of the project.</h2>
            <p className="text-lg text-slate-500">A real look at how a milestone moves from funded to paid, and what each side sees along the way.</p>
          </div>
          <div className="relative overflow-hidden rounded-[28px] bg-slate-900 p-6 sm:p-12">
            <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(600px 300px at 90% 0%, rgba(16,185,129,0.16), transparent 70%), radial-gradient(500px 320px at 5% 100%, rgba(16,185,129,0.08), transparent 65%)"}}/>
            <div className="relative mb-7 flex flex-wrap gap-1.5">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} className={`rounded-[9px] px-4 py-2.5 text-[13.5px] font-semibold transition ${activeTab === t.id ? "bg-emerald-500/20 text-white shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)]" : "text-slate-400 hover:text-white"}`}>{t.label}</button>
              ))}
            </div>
            <div className="relative min-h-[380px] rounded-[18px] bg-white p-6 shadow-[0_30px_70px_rgba(0,0,0,0.35)] sm:p-7">
              {activeTab === "overview" && (
                <div>
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div><h4 className="text-lg font-bold text-slate-900">Brand Redesign · Lagos Retail Co.</h4><p className="text-sm text-slate-400">Workspace · 4 milestones · $5,500 total budget</p></div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 font-mono text-xs font-semibold text-orange-700">IN PROGRESS</span>
                  </div>
                  <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400" style={{width:"65%"}}/></div>
                  {[{dot:"#10B981",title:"Discovery Call",meta:"$500 · Released"},{dot:"#2563EB",title:"Wireframes",meta:"$1,200 · Approved"},{dot:"#C2660D",title:"Final Build",meta:"$3,000 · In Progress"},{dot:"#94A3B8",title:"Launch Support",meta:"$800 · Draft"}].map(r => (
                    <div key={r.title} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                      <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full flex-shrink-0" style={{background:r.dot}}/><span className="text-sm font-medium text-slate-900">{r.title}</span></div>
                      <span className="font-mono text-sm text-slate-400">{r.meta}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "milestones" && (
                <div>
                  <div className="mb-5 flex items-center justify-between"><h4 className="text-lg font-bold text-slate-900">Milestones</h4><span className="text-sm text-slate-400">4 total</span></div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] text-sm">
                      <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">{["Title","Amount","Due","Status",""].map(h => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
                      <tbody>
                        {[{t:"Discovery Call",a:"$500.00",d:"Jun 02",s:"RELEASED",sc:"bg-emerald-50 text-emerald-700"},{t:"Wireframes",a:"$1,200.00",d:"Jun 09",s:"APPROVED",sc:"bg-blue-50 text-blue-700"},{t:"Final Build",a:"$3,000.00",d:"Jun 24",s:"SUBMITTED",sc:"bg-purple-50 text-purple-700",btn:true},{t:"Launch Support",a:"$800.00",d:"Jul 01",s:"DRAFT",sc:"bg-slate-100 text-slate-500"}].map(r => (
                          <tr key={r.t} className="border-b border-slate-50">
                            <td className="py-3 pr-4 font-medium text-slate-900">{r.t}</td>
                            <td className="py-3 pr-4 font-mono text-slate-500">{r.a}</td>
                            <td className="py-3 pr-4 font-mono text-slate-400">{r.d}</td>
                            <td className="py-3 pr-4"><span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold ${r.sc}`}>{r.s}</span></td>
                            <td className="py-3">{r.btn && <button className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">Approve</button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === "payments" && (
                <div>
                  <div className="mb-5 flex items-center justify-between"><h4 className="text-lg font-bold text-slate-900">Payments</h4><span className="text-sm text-slate-400">Lifetime across all workspaces</span></div>
                  <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[{l:"ESCROW BALANCE",v:"$3,200"},{l:"PENDING RELEASE",v:"$1,200"},{l:"RELEASED TO DATE",v:"$8,400"}].map(s => (
                      <div key={s.l} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-emerald-600 to-emerald-300 opacity-70"/>
                        <div className="mb-1.5 font-mono text-xs text-slate-400">{s.l}</div>
                        <div className="font-mono text-2xl font-bold text-slate-900">{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === "chat" && (
                <div>
                  <div className="mb-5"><h4 className="text-lg font-bold text-slate-900">Team Collaboration</h4><p className="text-sm text-slate-400">Final Build milestone</p></div>
                  <div className="max-w-[70%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm text-slate-800">Sent the homepage draft over, let me know what you think before I move to the product pages.</div>
                  <p className="mb-4 mt-1 font-mono text-[11px] text-slate-400">Lara · 10:14 AM</p>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">📎 homepage-draft-v3.fig · 4.2 MB</div>
                  <div className="ml-auto max-w-[70%] rounded-2xl rounded-br-sm bg-slate-900 px-4 py-3 text-sm text-white">Looks great, just one tweak on the hero spacing and we&apos;re good to submit for approval.</div>
                  <p className="mt-1 text-right font-mono text-[11px] text-slate-400">You · 10:31 AM</p>
                </div>
              )}
              {activeTab === "files" && (
                <div>
                  <div className="mb-5 flex items-center justify-between"><h4 className="text-lg font-bold text-slate-900">Files</h4><span className="text-sm text-slate-400">12 files across this workspace</span></div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[{e:"📄",n:"contract-v1.pdf",m:"220 KB · Jun 02",bg:"#FEF2F2"},{e:"🎨",n:"homepage-v3.fig",m:"4.2 MB · Jun 14",bg:"#EFF6FF"},{e:"🗂️",n:"assets-final.zip",m:"18.6 MB · Jun 16",bg:"#F1F5F9"},{e:"🖼️",n:"logo-export.png",m:"1.1 MB · Jun 16",bg:"#ECFDF5"}].map(f => (
                      <div key={f.n} className="rounded-xl border border-slate-100 p-4 text-center">
                        <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-[9px] text-lg" style={{background:f.bg}}>{f.e}</div>
                        <div className="text-xs font-semibold text-slate-900 break-all">{f.n}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">{f.m}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === "approval" && (
                <div>
                  <div className="mb-5"><h4 className="text-lg font-bold text-slate-900">Client Approval Flow</h4><p className="text-sm text-slate-400">Final Build milestone</p></div>
                  <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-200 p-5 sm:flex-row sm:items-start">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">🖥️</div>
                    <div>
                      <h5 className="mb-1.5 text-sm font-bold text-slate-900">Final Build submitted for review</h5>
                      <p className="mb-4 text-sm leading-relaxed text-slate-500">Lara submitted the completed homepage build on Jun 16, 10:42 AM. Review the deliverable and approve to release $3,000.00 from escrow.</p>
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">Approve & Release</button>
                        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Request Changes</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto mb-14 max-w-[640px] text-center">
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Used in the field
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Freelancers and agencies already running on Milestack</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { q:"Milestack took the awkwardness out of asking new clients for money upfront. Funding the first milestone is just part of how we kick off every project now.", name:"Tunde A.", role:"Brand Designer", initials:"TA" },
              { q:"I stopped chasing invoices entirely. The client funds the milestone, I deliver, they approve, and the money is already sitting there waiting.", name:"Wale O.", role:"Web Developer", initials:"WO" },
              { q:"We run every contractor we bring on through referrals through Milestack now. It's the trust layer we didn't know we needed until we had it.", name:"Lara M.", role:"Agency Founder", initials:"LM" },
            ].map(t => (
              <div key={t.name} className="flex flex-col gap-5 rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-emerald-50/30 p-7 shadow-sm">
                <div>
                  <span className="block text-3xl font-extrabold leading-none" style={{background:"linear-gradient(135deg,#059669,#34d399)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}}>&ldquo;</span>
                  <p className="text-[15.5px] leading-relaxed text-slate-800">{t.q}</p>
                </div>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 font-mono text-xs font-bold text-white">{t.initials}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                    <div className="font-mono text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-28">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto mb-16 max-w-[640px] text-center">
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Pricing
            </div>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">Freelancers keep 100%. Clients pay for protection.</h2>
            <p className="text-lg text-slate-500">Milestack is free to join for freelancers. Clients pay a transparent Project Protection Fee only when they fund a project.</p>
          </div>
          <div className="mx-auto grid max-w-[980px] gap-6 sm:grid-cols-2 items-stretch">
            {/* Project protection fee */}
            <div className="flex flex-col rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-emerald-50/30 p-10 shadow-lg">
              <span className="mb-3 inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Project Protection Fee</span>
              <div className="mb-3 font-mono text-5xl font-extrabold tracking-tight" style={{background:"linear-gradient(135deg,#0f172a,#059669)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}}>
                10%
                <span className="mt-2 block font-sans text-sm font-normal text-slate-500">paid by the client, on top of the project amount</span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-500">Charged to the client when they fund a project — never deducted from what the freelancer earns.</p>
              <p className="mb-8 text-xs leading-relaxed text-slate-400">Covers escrow protection, identity verification, fraud prevention, milestone management, secure payment processing, and dispute resolution.</p>
              <Link href="/signup" className="mt-auto rounded-[10px] bg-emerald-500 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">Start a Workspace</Link>
            </div>
            {/* Membership */}
            <div className="relative flex flex-col overflow-hidden rounded-3xl bg-slate-900 p-10 shadow-2xl">
              <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(420px 280px at 100% 0%, rgba(16,185,129,0.22), transparent 70%)"}}/>
              <div className="relative">
                <span className="mb-3 inline-flex w-fit rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white">Optional · For Freelancers</span>
                <div className="mb-1 mt-3 text-lg font-bold text-white">Verified Freelancer Membership</div>
                <div className="mb-1 font-mono text-5xl font-extrabold text-white">$5<span className="font-sans text-sm font-normal text-slate-400">/month</span></div>
                <p className="mb-6 text-sm text-slate-400">Stand out to clients and run unlimited workspaces.</p>
                <ul className="mb-8 space-y-3">
                  {["Verified freelancer badge","Professional profile","Unlimited client workspaces","Portfolio profile","Priority support"].map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <CheckIcon/>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block rounded-[10px] bg-white px-6 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">Get Verified</Link>
              </div>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">You found the client. Keep every dollar you earn. Running a larger team? <a href="#" className="font-semibold text-slate-900 underline">Talk to us</a> about custom terms.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mx-auto mb-14 max-w-[640px] text-center">
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Questions
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Frequently asked questions</h2>
          </div>
          <div className="mx-auto max-w-[760px]">
            {FAQ_ITEMS.map(item => <FaqItem key={item.q} {...item}/>)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="relative overflow-hidden rounded-[28px] bg-slate-900 px-8 py-16 text-center sm:px-12">
            <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(500px 260px at 50% 0%, rgba(16,185,129,0.24), transparent 70%), radial-gradient(420px 240px at 100% 100%, rgba(16,185,129,0.10), transparent 65%)"}}/>
            <div className="relative">
              <h2 className="mb-3.5 text-3xl font-bold tracking-tight text-white sm:text-4xl">Bring the client you already have.<br/>We&apos;ll handle the trust.</h2>
              <p className="mb-8 text-lg text-slate-400">Set up your first workspace in under five minutes — with no marketplace listing, no waiting to get picked.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/signup" className="rounded-[10px] bg-emerald-500 px-7 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-md">Start a Workspace</Link>
                <a href="#how" className="rounded-[10px] border border-white/25 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">See How It Works</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative bg-slate-900 pb-8 pt-20 text-slate-400">
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"/>
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-14 grid gap-8 border-b border-white/10 pb-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="mb-4 flex items-center gap-2.5 text-lg font-extrabold text-white"><LogoMark/>Milestack</Link>
              <p className="max-w-[240px] text-sm leading-relaxed text-slate-500">Secure Milestones. Trusted Payments. The trust layer for freelance work between people who already know each other.</p>
            </div>
            {[
              { title:"Product", links:[{l:"Features",h:"#features"},{l:"Pricing",h:"#pricing"},{l:"Security",h:"#faq"},{l:"How it works",h:"#how"}] },
              { title:"Company", links:[{l:"About",h:"#"},{l:"Careers",h:"#"},{l:"Contact",h:"#"}] },
              { title:"Resources", links:[{l:"FAQ",h:"#faq"},{l:"Terms",h:"#"},{l:"Privacy",h:"#"}] },
            ].map(col => (
              <div key={col.title}>
                <h5 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-white">{col.title}</h5>
                {col.links.map(l => <a key={l.l} href={l.h} className="mb-3 block text-sm hover:text-white transition-colors">{l.l}</a>)}
              </div>
            ))}
            <div>
              <h5 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-white">Connect</h5>
              <div className="flex gap-3">
                {[
                  <path key="tw" d="M22 4.01c-1 .5-1.8.6-2.6.7 1-.6 1.7-1.5 2-2.6-.9.5-1.8.9-2.9 1.1A4.3 4.3 0 0015.5 2c-2.4 0-4.2 2.2-3.7 4.5C8.8 6.2 6 4.8 4 2.5c-1 1.7-.5 4 1.2 5.1-.8 0-1.5-.2-2.2-.5 0 1.8 1.3 3.4 3 3.8-.7.2-1.5.2-2.2.1.6 1.9 2.4 3.2 4.4 3.3-1.6 1.3-3.7 2-5.8 1.7 2.1 1.3 4.5 2.1 7.1 2.1 8.5 0 13.1-7.2 12.8-13.6.9-.6 1.6-1.5 2-2.4z"/>,
                  <><rect key="ig-r" x="4" y="4" width="16" height="16" rx="3"/><circle key="ig-c" cx="12" cy="12" r="3.2"/><circle key="ig-d" cx="16.2" cy="7.8" r="0.6" fill="currentColor"/></>,
                  <><rect key="li-r" x="3" y="3" width="18" height="18" rx="2"/><path key="li-p1" d="M7 10v7M7 7v.01M12 17v-4.5a2.5 2.5 0 015 0V17M12 10v7"/></>,
                ].map((icon, i) => (
                  <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/5 hover:bg-emerald-500/20 transition-colors">
                    <svg className="h-4 w-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>© 2026 Milestack. All rights reserved.</span>
            <span>Payments processed by regulated third-party partners.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
