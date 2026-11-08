"use client";

import { useActionState, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveTalentListing, uploadCv, removeCv } from "@/lib/talent/actions";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none";

export function TalentListingForm({
  headline, linkedinUrl, linkedinName, verified, listed, hasHandle, hasBio, hasSkills, hasCategory, notice, cvName,
}: {
  cvName: string | null;
  headline: string | null;
  linkedinUrl: string | null;
  linkedinName: string | null;
  verified: boolean;
  listed: boolean;
  hasHandle: boolean;
  hasBio: boolean;
  hasSkills: boolean;
  hasCategory: boolean;
  notice: { status: string; msg?: string } | null;
}) {
  const [state, formAction, pending] = useActionState(saveTalentListing, null);
  const [cvState, cvAction, cvPending] = useActionState(uploadCv, null);
  const [removing, startRemoving] = useTransition();
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  async function verifyWithLinkedIn() {
    setLinking(true);
    setLinkError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider: "linkedin_oidc",
      options: { redirectTo: `${window.location.origin}/auth/linkedin/callback` },
    });
    if (error) {
      setLinking(false);
      setLinkError(error.message);
    }
  }

  const checklist = [
    { ok: verified, label: "Verified with LinkedIn" },
    { ok: hasHandle, label: "Profile handle set" },
    { ok: hasBio, label: "Bio written" },
    { ok: hasSkills, label: "At least one skill added" },
    { ok: hasCategory, label: "Category chosen" },
  ];

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-[15px] font-bold text-[#0F172A]">Talent Space</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Get found by clients. Only clients can see your listing, and they reach you through your LinkedIn profile.
        </p>
      </div>

      {notice?.status === "verified" && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">LinkedIn verified.</p>
      )}
      {notice?.status === "error" && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
          Couldn&apos;t verify with LinkedIn{notice.msg ? `: ${notice.msg}` : "."}
        </p>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        {verified ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[13px] font-medium text-emerald-700">
            ✓ LinkedIn verified{linkedinName ? ` as ${linkedinName}` : ""}
          </span>
        ) : (
          <button
            type="button"
            onClick={verifyWithLinkedIn}
            disabled={linking}
            className="rounded-xl bg-[#0A66C2] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#0958a8] disabled:opacity-60"
          >
            {linking ? "Opening LinkedIn…" : "Verify with LinkedIn"}
          </button>
        )}
        {linkError && <span className="text-[13px] text-red-600">{linkError}</span>}
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Headline</label>
          <input name="headline" defaultValue={headline ?? ""} maxLength={120}
            placeholder="e.g. Brand designer for fintech startups" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">LinkedIn profile link</label>
          <input name="linkedin_url" defaultValue={linkedinUrl ?? ""}
            placeholder="https://www.linkedin.com/in/your-name" className={inputClass} />
          <p className="mt-1 text-[12px] text-slate-400">Clients will be sent here when they click Contact on LinkedIn.</p>
        </div>

        <ul className="space-y-1 text-[13px]">
          {checklist.map((c) => (
            <li key={c.label} className={c.ok ? "text-emerald-700" : "text-slate-400"}>
              {c.ok ? "✓" : "○"} {c.label}
            </li>
          ))}
        </ul>

        <label className="flex items-center gap-2 text-[14px] text-slate-700">
          <input type="checkbox" name="talent_listed" defaultChecked={listed} disabled={!verified}
            className="h-4 w-4 rounded border-slate-300" />
          List me in the Talent Space
        </label>

        {state && "error" in state && <p className="text-[13px] text-red-600">{state.error}</p>}
        {state && "success" in state && <p className="text-[13px] text-emerald-600">Saved.</p>}

        <button type="submit" disabled={pending}
          className="flex h-[40px] items-center rounded-xl bg-emerald-500 px-5 text-[14px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition">
          {pending ? "Saving…" : "Save listing"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-[14px] font-semibold text-[#0F172A]">CV (optional)</h3>
        <p className="mb-3 mt-1 text-[12.5px] text-slate-500">
          A PDF under 5 MB. Only clients can download it, and only while you&apos;re listed.
        </p>
        {cvName && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
            <span className="truncate">📄 {cvName}</span>
            <button type="button" disabled={removing}
              onClick={() => startRemoving(async () => { await removeCv(); })}
              className="ml-3 flex-shrink-0 text-[12.5px] font-medium text-red-600 hover:underline disabled:opacity-50">
              {removing ? "Removing…" : "Remove"}
            </button>
          </div>
        )}
        <form action={cvAction} className="flex flex-wrap items-center gap-3">
          <input type="file" name="cv" accept="application/pdf" required
            className="text-[13px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-slate-700 hover:file:bg-slate-200" />
          <button type="submit" disabled={cvPending}
            className="rounded-xl border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {cvPending ? "Uploading…" : cvName ? "Replace CV" : "Upload CV"}
          </button>
        </form>
        {cvState && "error" in cvState && <p className="mt-2 text-[13px] text-red-600">{cvState.error}</p>}
        {cvState && "success" in cvState && <p className="mt-2 text-[13px] text-emerald-600">CV saved.</p>}
      </div>
    </div>
  );
}
