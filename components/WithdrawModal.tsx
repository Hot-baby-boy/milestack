"use client";

import { useState } from "react";

const METHODS = [
  { value: "local_bank",  label: "Local Bank Transfer" },
  { value: "paypal",      label: "PayPal" },
  { value: "payoneer",    label: "Payoneer" },
  { value: "wise",        label: "Wise" },
  { value: "raenest",     label: "Raenest" },
];

const DETAIL_LABEL: Record<string, string> = {
  local_bank: "Account number & bank name",
  paypal:     "PayPal email address",
  payoneer:   "Payoneer email address",
  wise:       "Wise email or account details",
  raenest:    "Raenest email address",
};

export function WithdrawModal({
  available, currency, savedMethod, savedDetails,
}: {
  available: number; currency: string; savedMethod?: string | null; savedDetails?: string | null;
}) {
  const [open, setOpen]       = useState(false);
  const [method, setMethod]   = useState(savedMethod ?? "local_bank");
  const [amount, setAmount]   = useState("");
  const [details, setDetails] = useState(savedDetails ?? "");
  const [done, setDone]       = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDone(true);
  }

  function handleClose() {
    setOpen(false);
    setDone(false);
    setAmount("");
    setDetails(savedDetails ?? "");
    setMethod(savedMethod ?? "local_bank");
  }

  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-[34px] items-center rounded-full border border-white/20 bg-white/10 px-4 text-[13px] font-semibold text-white hover:bg-white/20 transition"
      >
        Withdraw →
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{background:"rgba(15,23,42,0.5)"}}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl">
            {!done ? (
              <>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-[17px] font-bold text-[#0F172A]">Request withdrawal</h2>
                    <p className="mt-0.5 text-[13px] text-slate-500">Available: <span className="font-semibold text-emerald-600">{fmt(available)}</span></p>
                  </div>
                  <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Amount</label>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                      <span className="text-[13px] font-mono text-slate-400">{currency}</span>
                      <input
                        type="number" min="1" max={available} step="0.01" required
                        value={amount} onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-[14px] font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Payout method</label>
                    <select
                      value={method} onChange={e => setMethod(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-slate-700">{DETAIL_LABEL[method]}</label>
                    <input
                      type="text" required
                      value={details} onChange={e => setDetails(e.target.value)}
                      placeholder="Enter details…"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <button type="submit"
                    className="w-full rounded-xl bg-emerald-500 py-3 text-[14px] font-semibold text-white hover:bg-emerald-600 transition"
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
