"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Modal } from "@/components/Modal";
import { removeBanner, saveBasics, uploadAvatar, uploadBanner } from "./actions";
import { ProfileCover } from "@/components/profile/ProfileCover";
import { PencilButton, SaveButton, inputClass } from "./ui";

export function ProfileHeader({
  name, handle, headline, avatarUrl, bannerUrl, hourlyRate, rating,
}: {
  name: string;
  handle: string | null;
  headline: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  hourlyRate: number | null;
  rating: { avg: number; count: number } | null;
}) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatar, null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [bannerState, bannerAction, bannerPending] = useActionState(uploadBanner, null);
  const [removing, startRemoving] = useTransition();
  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await saveBasics(prev, formData);
      if ("success" in result) setEditing(false);
      return result;
    },
    null,
  );

  async function share() {
    if (!handle) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${handle}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked: ignore */ }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <ProfileCover bannerUrl={bannerUrl} className="h-36 sm:h-48">
        <div className="absolute left-3 top-3 max-w-[70%] space-y-1.5 sm:left-4 sm:top-4">
          {bannerState && "error" in bannerState && (
            <p className="rounded-lg bg-red-50/95 px-3 py-1.5 text-[12.5px] font-medium text-red-700 shadow-sm">{bannerState.error}</p>
          )}
          {!bannerUrl && (
            <p className="rounded-lg bg-white/90 px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm">
              Add a banner so clients notice you · best size 1600 × 400 · JPG, PNG or WebP · up to 4 MB
            </p>
          )}
        </div>
        <form action={bannerAction} className="absolute bottom-3 right-3 flex items-center gap-2">
          <input ref={bannerRef} type="file" name="banner" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) e.target.form?.requestSubmit(); }} />
          {bannerUrl && (
            <button type="button" disabled={removing}
              onClick={() => startRemoving(async () => { await removeBanner(); })}
              className="rounded-lg bg-white/90 px-3 py-1.5 text-[13px] font-semibold text-slate-700 shadow-sm hover:bg-white disabled:opacity-50">
              {removing ? "Removing…" : "Remove"}
            </button>
          )}
          <button type="button" onClick={() => bannerRef.current?.click()} disabled={bannerPending}
            className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-[13px] font-semibold text-slate-800 shadow-sm hover:bg-white disabled:opacity-50">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
            {bannerPending ? "Uploading…" : bannerUrl ? "Change banner" : "Add banner"}
          </button>
        </form>
      </ProfileCover>
      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
      <div className="-mt-12 flex flex-col gap-6 sm:-mt-14 sm:flex-row sm:items-start">
        <div className="relative h-28 w-28 flex-shrink-0 sm:h-32 sm:w-32">
          <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="128px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-4xl font-semibold text-slate-400">
                {name[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <form action={avatarAction}>
            <input ref={avatarRef} type="file" name="avatar" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) e.target.form?.requestSubmit(); }} />
            <button type="button" onClick={() => avatarRef.current?.click()} disabled={avatarPending}
              aria-label="Change photo" title="Change photo"
              className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
          </form>
        </div>

        <div className="min-w-0 flex-1 sm:pt-16">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-[26px] font-bold leading-tight text-[#0F172A]">{name}</h2>
                <PencilButton onClick={() => setEditing(true)} label="Edit name, headline and rate" />
              </div>
              <p className="mt-1 text-[14px] text-slate-500">{handle ? `@${handle}` : "Add a handle to get your public link"}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={share} disabled={!handle}
                className="rounded-xl border border-slate-300 px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                {copied ? "Link copied" : "Share"}
              </button>
              {handle ? (
                <a href={`/p/${handle}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50">
                  Preview
                </a>
              ) : (
                <span className="cursor-not-allowed rounded-xl border border-slate-200 px-4 py-2 text-[14px] font-semibold text-slate-300">Preview</span>
              )}
            </div>
          </div>

          <p className={`mt-4 text-[17px] font-semibold leading-snug ${headline ? "text-[#0F172A]" : "text-slate-400"}`}>
            {headline || "Add a headline so clients know what you do"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] text-slate-600">
            {rating && <span><span className="text-amber-400">★</span> {rating.avg.toFixed(1)} ({rating.count} review{rating.count === 1 ? "" : "s"})</span>}
            {hourlyRate ? <span>USD {Number(hourlyRate).toLocaleString()}/hr</span> : <span className="text-slate-400">No hourly rate set</span>}
          </div>
          {avatarState && "error" in avatarState && <p className="mt-2 text-[13px] text-red-600">{avatarState.error}</p>}
        </div>
      </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit your details">
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Display name</label>
            <input name="display_name" defaultValue={name} className={inputClass} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Profile handle</label>
            <div className="flex items-center rounded-lg border border-slate-300 px-3 py-2 focus-within:border-emerald-500">
              <span className="mr-1 text-sm text-slate-400">milestack.app/p/</span>
              <input name="handle" defaultValue={handle ?? ""} className="flex-1 text-sm text-slate-900 placeholder-slate-400 focus:outline-none" placeholder="jane-doe" />
            </div>
            <p className="mt-1 text-xs text-slate-400">3–30 lowercase letters, numbers, hyphens</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Headline</label>
            <input name="headline" defaultValue={headline ?? ""} maxLength={120} className={inputClass}
              placeholder="e.g. Brand designer for fintech startups" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Hourly rate (USD)</label>
            <input name="hourly_rate" type="number" min="0" step="0.01" defaultValue={hourlyRate ?? ""} className={inputClass} placeholder="50" />
          </div>
          {state && "error" in state && <p className="text-[13px] text-red-600">{state.error}</p>}
          <SaveButton pending={pending} />
        </form>
      </Modal>
    </div>
  );
}
