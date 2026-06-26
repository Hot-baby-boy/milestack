"use client";

import { useActionState, useRef } from "react";
import Image from "next/image";
import { updateProfile, uploadAvatar } from "./actions";

type Profile = {
  role: string;
  display_name: string | null;
  bio: string | null;
  skills: string[];
  hourly_rate: number | null;
  avatar_url: string | null;
  handle: string | null;
} | null;

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none";

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, null);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatar, null);
  const avatarRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      {/* Avatar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl text-slate-400">
              {(profile?.display_name ?? email)[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <form action={avatarAction}>
          <input
            ref={avatarRef}
            type="file"
            name="avatar"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                e.target.form?.requestSubmit();
              }
            }}
          />
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            disabled={avatarPending}
            className="text-sm font-medium text-emerald-600 hover:underline disabled:opacity-50"
          >
            {avatarPending ? "Uploading…" : "Change photo"}
          </button>
          {avatarState && "error" in avatarState && (
            <p className="mt-1 text-xs text-red-500">{avatarState.error}</p>
          )}
        </form>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <p className="text-sm text-slate-500">{email}</p>
        </div>

        <div>
          <label htmlFor="display_name" className="mb-1 block text-sm font-medium text-slate-700">
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            className={inputClass}
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label htmlFor="handle" className="mb-1 block text-sm font-medium text-slate-700">
            Profile handle
          </label>
          <div className="flex items-center rounded-lg border border-slate-300 px-3 py-2 focus-within:border-emerald-500">
            <span className="mr-1 text-sm text-slate-400">milestack.app/p/</span>
            <input
              id="handle"
              name="handle"
              defaultValue={profile?.handle ?? ""}
              className="flex-1 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              placeholder="jane-doe"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">3–30 lowercase letters, numbers, hyphens</p>
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium text-slate-700">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={profile?.bio ?? ""}
            className={inputClass}
            placeholder="A short description about yourself…"
          />
        </div>

        {profile?.role === "freelancer" && (
          <>
            <div>
              <label htmlFor="skills" className="mb-1 block text-sm font-medium text-slate-700">
                Skills
              </label>
              <input
                id="skills"
                name="skills"
                defaultValue={(profile?.skills ?? []).join(", ")}
                className={inputClass}
                placeholder="UI Design, React, Figma"
              />
              <p className="mt-1 text-xs text-slate-400">Comma-separated</p>
            </div>

            <div>
              <label htmlFor="hourly_rate" className="mb-1 block text-sm font-medium text-slate-700">
                Hourly rate (USD)
              </label>
              <input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                min="0"
                step="0.01"
                defaultValue={profile?.hourly_rate ?? ""}
                className={inputClass}
                placeholder="50"
              />
            </div>
          </>
        )}

        {state && "error" in state && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}
        {state && "success" in state && (
          <p className="text-sm text-emerald-600">Profile saved.</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
