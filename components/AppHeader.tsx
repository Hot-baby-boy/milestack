import Link from "next/link";
import { Logo } from "@/components/Logo";
import { logout } from "@/app/(auth)/actions";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <Link href="/dashboard" className="flex items-center gap-2 text-base font-bold text-slate-900">
        <Logo size={24} />
        Milestack
      </Link>
      <form action={logout}>
        <button className="text-sm font-medium text-slate-500 hover:text-slate-700">Log out</button>
      </form>
    </header>
  );
}
