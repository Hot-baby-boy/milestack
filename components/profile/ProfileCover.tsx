import Image from "next/image";

// The wide banner at the top of a profile card. With no banner it shows a soft
// gradient. `children` is for a control placed over the banner (e.g. "Change banner").
export function ProfileCover({
  bannerUrl, children, className = "h-36 sm:h-48",
}: {
  bannerUrl: string | null;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-slate-100 ${className}`}>
      {bannerUrl && (
        <Image src={bannerUrl} alt="" fill priority className="object-cover" sizes="(max-width: 1280px) 100vw, 1180px" />
      )}
      {children}
    </div>
  );
}

export function ProfileAvatar({
  avatarUrl, name, className = "h-28 w-28 sm:h-32 sm:w-32",
}: {
  avatarUrl: string | null;
  name: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm ${className}`}>
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="128px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-4xl font-semibold text-slate-400">
          {name[0]?.toUpperCase() ?? "?"}
        </span>
      )}
    </div>
  );
}
