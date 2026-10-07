import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Wordmark />
        <Link href="/" className="text-sm text-muted hover:text-ink">
          Bosh sahifa
        </Link>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-6 pb-16 sm:pt-12">{children}</main>
    </>
  );
}
