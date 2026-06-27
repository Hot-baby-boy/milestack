"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const METHODS = [
  { value: "local_bank", label: "Local Bank Transfer" },
  { value: "paypal",     label: "PayPal" },
  { value: "payoneer",   label: "Payoneer" },
  { value: "wise",       label: "Wise" },
  { value: "raenest",    label: "Raenest" },
];

const DETAIL_LABEL: Record<string, string> = {
  local_bank: "Account number & bank name",
  paypal:     "PayPal email address",
  payoneer:   "Payoneer email address",
  wise:       "Wise email or account details",
  raenest:    "Raenest email address",
};

const DETAIL_PLACEHOLDER: Record<string, string> = {
  local_bank: "e.g. 0123456789 — GTBank",
  paypal:     "e.g. you@email.com",
  payoneer:   "e.g. you@email.com",
  wise:       "e.g. you@email.com",
  raenest:    "e.g. you@email.com",
};

const METHOD_ICONS: Record<string, string> = {
  local_bank: "🏦",
  paypal:     "🅿️",
  payoneer:   "💳",
  wise:       "🌍",
  raenest:    "💸",
};

export function PayoutMethodForm({
  initialMethod,
  initialDetails,
  userId,
}: {
  initialMethod: string | null;
  initialDetails: string | null;
  userId: string;
}) {
  const [method, setMethod]   = useState(initialMethod ?? "local_bank");
  const [details, setDetails] = useState(initialDetails ?? "");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({ payout_method: method, payout_details: details })
      .eq("id", userId);

    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-[15px] font-bold text-[#0F172A]">Payout method</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Where you want to receive your earnings when you withdraw.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Method selector — pill buttons */}
        <div>
          <label className="mb-2 block text-[13px] font-medium text-slate-700">Choose method</label>
          <div className="flex flex-wrap gap-2">
            {METHODS.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => { setMethod(m.value); setDetails(""); }}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
                  method === m.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{METHOD_ICONS[m.value]}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Details field */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
            {DETAIL_LABEL[method]}
          </label>
          <input
            type="text"
            required
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder={DETAIL_PLACEHOLDER[method]}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving || !details.trim()}
          className="flex h-[40px] items-center gap-2 rounded-xl bg-emerald-500 px-5 text-[14px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save payout method"}
        </button>
      </form>
    </div>
  );
}
