import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { AsmanMark } from "@/components/asman-mark";

const NAV = [
  { href: "/dashboard", label: "Kabinet" },
  { href: "/dashboard/profile", label: "Profil" },
] as const;

/**
 * admin — admin panelga havola (sahifa foydalanuvchi rolini o‘zi biladi; skelet uchun kerak emas).
 * moderator — moderator panelga havola.
 * wide — kontent kompyuter ekranining butun kengligiga yoyiladi (kabinet bosh sahifasi).
 * Header doim butun kenglikda: menyu chapda, foydalanuvchi, "Chiqish" va logo o‘ngda.
 */
export function DashboardShell({
  aside,
  admin = false,
  moderator = false,
  wide = false,
  children,
}: {
  aside?: ReactNode;
  admin?: boolean;
  moderator?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  const nav = admin
    ? [...NAV, { href: "/admin", label: "Admin panel" }]
    : moderator
      ? [...NAV, { href: "/moderator", label: "Moderator paneli" }]
      : NAV;
  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6 lg:px-10">
          <nav aria-label="Kabinet" className="order-3 flex w-full gap-1 text-sm sm:order-none sm:w-auto">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="btn btn-ghost">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm">
            {aside}
            <LogoutButton />
            <Link href="/" aria-label="Bosh sahifa" className="inline-flex">
              <AsmanMark className="h-8 w-auto" />
            </Link>
          </div>
        </div>
      </header>
      <main
        className={`w-full flex-1 px-4 py-10 sm:px-6 ${wide ? "lg:px-10" : "mx-auto max-w-5xl"}`}
      >
        {children}
      </main>
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <DashboardShell>
      <div className="animate-pulse space-y-4 motion-reduce:animate-none" aria-label="Yuklanmoqda">
        <div className="h-9 w-72 rounded bg-line" />
        <div className="h-4 w-56 rounded bg-line" />
        <div className="h-4 w-64 rounded bg-line" />
      </div>
    </DashboardShell>
  );
}
