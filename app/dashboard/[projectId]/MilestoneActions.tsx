"use client";

import { useState, useEffect } from "react";
import { transitionMilestone } from "@/lib/milestones/actions";
import { initFundMilestone, confirmFundMilestone, releaseMilestone } from "@/lib/payments/service";
import { submitReview } from "@/lib/reviews/actions";

const PROTECTION_FEE_RATE = 0.10;

declare global {
  interface Window {
    PaystackPop?: {
      setup(config: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        currency: string;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }): { openIframe: () => void };
    };
  }
}

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
  onConfirm: () => void;
  onClose: () => void;
  pending: boolean;
  error: string | null;
}) {
  const fee = amount * PROTECTION_FEE_RATE;
  const total = amount + fee;
  const fmt = (n: number) => `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // Paystack Inline's script insists on finding itself inside a real <form>
  // element in the DOM at load time — next/script re-parents scripts into
  // <head> regardless of JSX position, which breaks that check. Inject it
  // by hand instead, once, into a form we control directly.
  useEffect(() => {
    if (document.getElementById("paystack-inline-script")) return;
    const form = document.createElement("form");
    form.style.display = "none";
    const script = document.createElement("script");
    script.id = "paystack-inline-script";
    script.src = "https://js.paystack.co/v1/inline.js";
    form.appendChild(script);
    document.body.appendChild(form);
  }, []);

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

          {/* Amount breakdown */}
          <div className="mx-6 mt-5 space-y-1.5 rounded-xl bg-emerald-50 px-4 py-3">
            <div className="flex justify-between text-[13px] text-emerald-700">
              <span>Milestone</span><span>{fmt(amount)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-emerald-700">
              <span>Project Protection Fee (10%)</span><span>{fmt(fee)}</span>
            </div>
            <div className="flex justify-between border-t border-emerald-200 pt-1.5 text-[15px] font-bold text-emerald-800">
              <span>Total to pay</span><span>{fmt(total)}</span>
            </div>
            <p className="pt-1 text-[11px] text-emerald-600">Held securely in escrow until you release it.</p>
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
              onClick={onConfirm}
              disabled={pending}
              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {pending ? "Processing…" : "Pay with Paystack"}
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
  const [optimisticStatus, setOptimisticStatus] = useState(status);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Sync when parent passes a new status (from realtime)
  useEffect(() => { setOptimisticStatus(status); }, [status]);

  const actions = actionsFor(optimisticStatus, isFreelancer, isClient);
  if (!actions.length && !showReviewModal) return null;

  async function act(newStatus: string) {
    if (newStatus === "funded") { setShowFundModal(true); return; }
    setOptimisticStatus(newStatus); // instant UI update
    setPending(newStatus);
    setError(null);
    const result =
      newStatus === "released"
        ? await releaseMilestone(milestoneId, projectId)
        : await transitionMilestone(milestoneId, projectId, newStatus);
    setPending(null);
    if (result?.error) {
      setOptimisticStatus(status); // revert on error
      setError(result.error);
      return;
    }
    if (newStatus === "released" && isClient) setShowReviewModal(true);
  }

  async function confirmFund() {
    setPending("funded");
    setError(null);

    const intent = await initFundMilestone(milestoneId, projectId);
    if ("error" in intent) {
      setPending(null);
      setError(intent.error);
      return;
    }

    const paystack = window.PaystackPop;
    if (!paystack) {
      setPending(null);
      setError("Payment system is still loading — try again in a moment.");
      return;
    }

    paystack.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: intent.email,
      amount: intent.amountKobo,
      ref: intent.reference,
      currency: "NGN",
      onClose: () => setPending(null),
      callback: (response) => {
        confirmFundMilestone(response.reference, projectId).then((result) => {
          setPending(null);
          if (result?.error) {
            setError(result.error);
            return;
          }
          setOptimisticStatus("funded");
          setShowFundModal(false);
        });
      },
    }).openIframe();
  }

  return (
    <>
      <div className="mt-2 flex flex-col items-end gap-1">
        <div className="flex flex-wrap justify-end gap-1.5">
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
