"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PayoutLogo, METHODS, METHOD_FIELDS, type FieldDef } from "@/components/PayoutIcons";

function parseDetails(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { email: raw }; }
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  if (field.type === "select") {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} required
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[14px] text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <option value="">Select…</option>
        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <input type={field.type ?? "text"} required
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    />
  );
}

export function PayoutMethodForm({
  initialMethod, initialDetails, userId,
}: {
  initialMethod: string | null;
  initialDetails: string | null;
  userId: string;
}) {
  const [method, setMethod]   = useState(initialMethod ?? "local_bank");
  const [values, setValues]   = useState<Record<string, string>>(parseDetails(initialDetails));
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fields = METHOD_FIELDS[method] ?? [];

  function handleMethodChange(m: string) {
    setMethod(m);
    setValues({});
    setSaved(false);
  }

  function setField(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  const isComplete = fields.every(f => (values[f.key] ?? "").trim() !== "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({ payout_method: method, payout_details: JSON.stringify(values) })
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
        <p className="mt-1 text-[13px] text-slate-500">Where you want to receive your earnings when you withdraw.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Method selector */}
        <div>
          <label className="mb-2 block text-[13px] font-medium text-slate-700">Choose method</label>
          <div className="flex flex-wrap gap-2">
            {METHODS.map(m => (
              <button key={m.value} type="button"
                onClick={() => handleMethodChange(m.value)}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[13px] font-medium transition ${
                  method === m.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <PayoutLogo method={m.value} size={22}/>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic fields */}
        {fields.map(field => (
          <div key={field.key}>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">{field.label}</label>
            <FieldInput field={field} value={values[field.key] ?? ""} onChange={v => setField(field.key, v)}/>
          </div>
        ))}

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button type="submit" disabled={saving || !isComplete}
          className="flex h-[40px] items-center gap-2 rounded-xl bg-emerald-500 px-5 text-[14px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save payout method"}
        </button>
      </form>
    </div>
  );
}
