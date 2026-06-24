import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-slate-900">
        <Logo size={36} />
        Milestack
      </div>
      <p className="max-w-sm text-slate-500">
        Trust and payments for freelancers and their own clients.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/signup"
          className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
