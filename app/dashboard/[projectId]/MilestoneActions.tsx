"use client";

import { useState } from "react";
import { transitionMilestone } from "@/lib/milestones/actions";
import { fundMilestone, releaseMilestone } from "@/lib/payments/service";
import { submitReview } from "@/lib/reviews/actions";

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

const PAYMENT_METHODS = [
  {
    id: "paypal",
    label: "PayPal",
    description: "Pay via your PayPal account",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M7.5 3h6.5C17.5 3 20 5 19.5 8.5 18.9 12.5 16 14 12.5 14H10L9 19H5.5L7.5 3Z" stroke="#003087" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M9.5 7h5C17 7 18.5 8.5 18 11c-.5 3-3 4-5.5 4H9" stroke="#009cde" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "card",
    label: "Debit / Credit Card",
    description: "Visa, Mastercard, Verve",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20M6 15h2M10 15h4"/>
      </svg>
    ),
  },
  {
    id: "bank",
    label: "Bank Transfer",
    description: "Direct bank payment",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l9-7 9 7M5 10v7a1 1 0 001 1h12a1 1 0 001-1v-7M9 21v-5a1 1 0 011-1h4a1 1 0 011 1v5"/>
      </svg>
    ),
  },
  {
    id: "usdc",
    label: "USDC / Crypto",
    description: "Stablecoin payment",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M15 8.5a4 4 0 00-6 3.5 4 4 0 006 3.5M12 6v2M12 16v2"/>
      </svg>
    ),
  },
];

function FundModal({
  amount,
  title,
  onConfirm,
  onClose,
  pending,
  error,
}: {
  amount: number;
  title: string;
  onConfirm: (method: string) => void;
  onClose: () => void;
  pending: boolean;
  error: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-[17px] font-bold text-[#0F172A]">Fund milestone</h2>
            <p className="mt-0.5 truncate text-[13px] text-slate-500">{title}</p>
          </div>

          {/* Amount */}
          <div className="mx-6 mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-center">
            <p className="text-[12px] font-medium text-emerald-700">Amount to fund</p>
            <p className="text-[28px] font-bold text-emerald-700">
              ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-600">Held securely in escrow until you release it.</p>
          </div>

          {/* Payment methods */}
          <div className="px-6 pt-5">
            <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">
              Choose payment method
            </p>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    selected === m.id
                      ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-400"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${selected === m.id ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {m.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-[#0F172A]">{m.label}</p>
                    <p className="text-[12px] text-slate-400">{m.description}</p>
                  </div>
                  <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                    selected === m.id ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                  }`}>
                    {selected === m.id && (
                      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Escrow note */}
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p className="text-[11.5px] text-slate-500">
              Funds are held in escrow. The freelancer only receives payment once you approve their work.
            </p>
          </div>

          {error && <p className="mx-6 mt-3 text-xs text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 px-6 py-5">
            <button
              onClick={() => selected && onConfirm(selected)}
              disabled={!selected || pending}
              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {pending ? "Processing…" : "Confirm payment"}
            </button>
            <button
              onClick={onClose}
              disabled={pending}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-500 transition hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition"
        >
          <svg className={`h-8 w-8 transition ${(hover || value) >= n ? "text-amber-400" : "text-slate-200"}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

function ReviewModal({
  title,
  freelancerId,
  milestoneId,
  projectId,
  onDone,
}: {
  title: string;
  freelancerId: string;
  milestoneId: string;
  projectId: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit() {
    if (!rating) return;
    setPending(true);
    const result = await submitReview(milestoneId, projectId, freelancerId, rating, body);
    setPending(false);
    if (result?.error) { setError(result.error); return; }
    setSubmitted(true);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={onDone} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

          {submitted ? (
            <div className="flex flex-col items-center px-8 py-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <h2 className="mb-1 text-[17px] font-bold text-[#0F172A]">Thank you!</h2>
              <p className="mb-6 text-[13px] text-slate-500">Your review has been posted on the freelancer&apos;s public profile.</p>
              <button onClick={onDone} className="rounded-xl bg-emerald-500 px-8 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition">
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-[17px] font-bold text-[#0F172A]">Rate this milestone</h2>
                <p className="mt-0.5 truncate text-[13px] text-slate-500">{title}</p>
              </div>

              <div className="px-6 pt-6">
                <p className="mb-3 text-[13px] font-medium text-slate-700">How would you rate the work?</p>
                <StarPicker value={rating} onChange={setRating} />
                {rating > 0 && (
                  <p className="mt-2 text-[12px] text-slate-400">
                    {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
                  </p>
                )}
              </div>

              <div className="px-6 pt-4">
                <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  Write a review <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  placeholder="Describe your experience working with this freelancer…"
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
              </div>

              <div className="flex gap-2 px-6 py-5">
                <button
                  onClick={onSubmit}
                  disabled={!rating || pending}
                  className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  {pending ? "Posting…" : "Post review"}
                </button>
                <button
                  onClick={onDone}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-500 transition hover:text-slate-700"
                >
                  Skip
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function MilestoneActions({
  milestoneId,
  projectId,
  status,
  amount,
  title,
  freelancerId,
  isFreelancer,
  isClient,
}: {
  milestoneId: string;
  projectId: string;
  status: string;
  amount: number;
  title: string;
  freelancerId: string;
  isFreelancer: boolean;
  isClient: boolean;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const actions = actionsFor(status, isFreelancer, isClient);
  if (!actions.length) return null;

  async function act(newStatus: string) {
    if (newStatus === "funded") { setShowFundModal(true); return; }
    setPending(newStatus);
    setError(null);
    const result =
      newStatus === "released"
        ? await releaseMilestone(milestoneId, projectId)
        : await transitionMilestone(milestoneId, projectId, newStatus);
    setPending(null);
    if (result?.error) { setError(result.error); return; }
    if (newStatus === "released" && isClient) setShowReviewModal(true);
  }

  async function confirmFund(_method: string) {
    setPending("funded");
    setError(null);
    const result = await fundMilestone(milestoneId, projectId);
    setPending(null);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowFundModal(false);
    }
  }

  return (
    <>
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

      {showFundModal && (
        <FundModal
          amount={amount}
          title={title}
          onConfirm={confirmFund}
          onClose={() => { setShowFundModal(false); setError(null); }}
          pending={pending === "funded"}
          error={error}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          title={title}
          freelancerId={freelancerId}
          milestoneId={milestoneId}
          projectId={projectId}
          onDone={() => setShowReviewModal(false)}
        />
      )}
    </>
  );
}
