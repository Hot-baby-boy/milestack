"use client";

import { useState } from "react";
import { PayoutLogo } from "@/components/PayoutIcons";
import { resolveBankAccountAction, savePayoutBankAccount } from "@/app/dashboard/profile/actions";
import { NIGERIAN_BANKS } from "@/lib/paystack";

function parseDetails(raw: string | null): { bank_code?: string; bank_name?: string; account_number?: string; account_name?: string } {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export function PayoutMethodForm({
  initialMethod, initialDetails,
}: {
  initialMethod: string | null;
  initialDetails: string | null;
}) {
  const saved = parseDetails(initialDetails);
  const [bankCode, setBankCode] = useState(saved.bank_code ?? "");
  const [accountNumber, setAccountNumber] = useState(saved.account_number ?? "");
  const [verifiedName, setVerifiedName] = useState<string | null>(
    initialMethod === "local_bank" ? saved.account_name ?? null : null,
  );
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved_, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bankName = NIGERIAN_BANKS.find((b) => b.code === bankCode)?.name ?? "";
  const canVerify = bankCode && accountNumber.trim().length >= 10;

  function resetVerification() {
    setVerifiedName(null);
    setSaved(false);
  }

  async function handleVerify() {
    setVerifying(true); setError(null);
    const result = await resolveBankAccountAction(bankCode, accountNumber.trim());
    setVerifying(false);
    if ("error" in result) { setError(result.error); return; }
    setVerifiedName(result.accountName);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!verifiedName) return;
    setSaving(true); setError(null); setSaved(false);
    const result = await savePayoutBankAccount({
      bankCode, bankName, accountNumber: accountNumber.trim(), accountName: verifiedName,
    });
    setSaving(false);
    if ("error" in result) { setError(result.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-[15px] font-bold text-[#0F172A]">Payout method</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          The Nigerian bank account you&apos;ll be paid into when a milestone is released.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700 w-fit">
          <PayoutLogo method="local_bank" size={22}/>
          Local Bank
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Bank</label>
          <select
            value={bankCode}
            onChange={(e) => { setBankCode(e.target.value); resetVerification(); }}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[14px] text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select your bank…</option>
            {NIGERIAN_BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Account number</label>
          <input
            type="text" inputMode="numeric" required
            value={accountNumber}
            onChange={(e) => { setAccountNumber(e.target.value); resetVerification(); }}
            placeholder="e.g. 0123456789"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {!verifiedName ? (
          <button
            type="button"
            onClick={handleVerify}
            disabled={!canVerify || verifying}
            className="flex h-[40px] items-center gap-2 rounded-xl border border-slate-300 px-5 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            {verifying ? "Verifying…" : "Verify account"}
          </button>
        ) : (
          <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700">
            <span className="font-semibold">Verified:</span> {verifiedName}
          </div>
        )}

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button type="submit" disabled={!verifiedName || saving}
          className="flex h-[40px] items-center gap-2 rounded-xl bg-emerald-500 px-5 text-[14px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : saved_ ? "✓ Saved!" : "Save payout method"}
        </button>
      </form>
    </div>
  );
}
