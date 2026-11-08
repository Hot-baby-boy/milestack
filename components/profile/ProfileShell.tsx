import { ProfileAvatar, ProfileCover } from "./ProfileCover";

export type ProfileStat = { label: string; value: string };

// Behance-style profile for people viewing a freelancer: a tall banner with the
// photo overlapping it, a left column with identity, actions, stats and bio, and
// a wide right column (tabs of work and reviews).
export function ProfileShell({
  name, headline, categoryLabel, avatarUrl, bannerUrl, verified,
  actions, stats, about, chips, children,
}: {
  name: string;
  headline: string | null;
  categoryLabel?: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  verified?: boolean;
  actions?: React.ReactNode;
  stats: ProfileStat[];
  about?: string | null;
  chips?: React.ReactNode;
  children: React.ReactNode; // the right column
}) {
  return (
    <div>
      <ProfileCover bannerUrl={bannerUrl} className="h-44 rounded-2xl sm:h-60 lg:h-72" />

      <div className="grid gap-8 px-1 pb-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-10 lg:px-4">
        {/* Left column */}
        <aside className="-mt-16 sm:-mt-20 lg:-mt-24">
          <ProfileAvatar avatarUrl={avatarUrl} name={name} className="h-32 w-32 sm:h-36 sm:w-36 lg:h-40 lg:w-40" />

          <h1 className="mt-4 text-[28px] font-bold leading-tight text-[#0F172A]">{name}</h1>
          {categoryLabel && <p className="mt-1 text-[15px] text-slate-600">{categoryLabel}</p>}
          {headline && <p className="mt-2 text-[15.5px] font-medium leading-snug text-[#0F172A]">{headline}</p>}
          {verified && <p className="mt-2 text-[13.5px] font-medium text-[#0A66C2]">✓ LinkedIn verified</p>}

          {actions && <div className="mt-5 space-y-3">{actions}</div>}

          {stats.length > 0 && (
            <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center justify-between py-3 text-[15px]">
                  <dt className="text-slate-600">{s.label}</dt>
                  <dd className="font-semibold text-[#0F172A]">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {about && (
            <div className="mt-6">
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">About</h2>
              <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-slate-700">{about}</p>
            </div>
          )}

          {chips && <div className="mt-6">{chips}</div>}
        </aside>

        {/* Right column */}
        <div className="min-w-0 pt-2 lg:pt-6">{children}</div>
      </div>
    </div>
  );
}
