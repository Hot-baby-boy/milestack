import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <Logo size={36} />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-slate-900">Page not found</h1>
        <p className="mb-6 text-sm text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
