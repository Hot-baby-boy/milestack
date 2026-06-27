"use client";

import { useState } from "react";
import { PayoutLogo, METHODS, METHOD_FIELDS } from "@/components/PayoutIcons";
import Link from "next/link";

function parseDetails(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { email: raw }; }
}

function detailSummary(method: string, details: Record<string, string>): string {
  const fields = METHOD_FIELDS[method] ?? [];
  return fields.map(f => details[f.key]).filter(Boolean).join(" · ");
}

export function WithdrawModal({
  available, currency, savedMethod, savedDetails,
}: {
  available: number; currency: string; savedMethod?: string | null; savedDetails?: string | null;
}) {
  const [open, setOpen]     = useState(false);
  const [method, setMethod] = useState(savedMethod ?? "");
  const [amount, setAmount] = useState("");
  const [done, setDone]     = useState(false);

  const saved = parseDetails(savedDetails);
  // Is the currently selected method the one they saved in settings?
  const isUsingSaved = method === savedMethod && !!savedDetails;
  const methodLabel = METHODS.find(m => m.value === method)?.label ?? "";

  function handleClose() {
    setOpen(false);
    setDone(false);
    setAmount("");
    setMethod(savedMethod ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDone(true);
  }

  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const canSubmit = !!amount && !!method && (isUsingSaved);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex h-[34px] items-center rounded-full border border-white/20 bg-white/10 px-4 text-[13px] font-semibold text-white hover:bg-white/20 transition"
      >
        Withdraw →
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{background:"rgba(15,23,42,0.5)"}}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            {!done ? (
              <>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#0F172A]">Request withdrawal</h2>
                    <p className="mt-0.5 text-[13px] text-slate-500">
                      Available: <span className="font-semibold text-emerald-600">{fmt(available)}</span>
                    </p>
                  </div>
                  <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Amount */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Amount</label>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                      <span className="font-mono text-[13px] text-slate-400">{currency}</span>
                      <input
                        type="number" min="1" max={available} step="0.01" required
                        value={amount} onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-[14px] font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Method selector */}
                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-slate-700">Payout method</label>
                    <div className="flex flex-wrap gap-2">
                      {METHODS.map(m => (
                        <button key={m.value} type="button"
                          onClick={() => setMethod(m.value)}
                          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                            method === m.value
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <PayoutLogo method={m.value} size={18}/>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* If selected method matches saved — show summary, no fields */}
                  {method && isUsingSaved && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <PayoutLogo method={method} size={20}/>
                        <span className="text-[13px] font-semibold text-emerald-800">{methodLabel}</span>
                        <svg className="h-4 w-4 text-emerald-500 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                      <p className="text-[12px] text-emerald-700">{detailSummary(method, saved)}</p>
                    </div>
                  )}

                  {/* If selected method differs from saved — prompt them to update settings */}
                  {method && !isUsingSaved && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
                      You haven't saved <strong>{methodLabel}</strong> details yet.{" "}
                      <Link href="/dashboard/profile" onClick={handleClose}
                        className="font-semibold underline hover:text-amber-900"
                      >
                        Add it in Settings →
                      </Link>
                    </div>
                  )}

                  {/* No method selected yet */}
                  {!method && (
                    <p className="text-[12px] text-slate-400">Select a method above to continue.</p>
                  )}

                  <button type="submit" disabled={!canSubmit}
                    className="w-full rounded-xl bg-emerald-500 py-3 text-[14px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-40 transition"
                  >
                    Submit request
                  </button>
                </form>
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <svg className="h-7 w-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h3 className="mb-1 text-[16px] font-bold text-[#0F172A]">Request received!</h3>
                <p className="mb-5 text-[13px] text-slate-500">We'll review your withdrawal and process it within 1–3 business days. You'll be notified once it's done.</p>
                <button onClick={handleClose}
                  className="w-full rounded-xl bg-emerald-500 py-3 text-[14px] font-semibold text-white hover:bg-emerald-600 transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
