"use client";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center">
        <h2 className="mb-2 text-base font-semibold text-red-600">Profile page error</h2>
        <p className="mb-4 text-sm text-slate-600 break-all">{error.message}</p>
        {error.digest && (
          <p className="mb-4 text-xs text-slate-400">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
