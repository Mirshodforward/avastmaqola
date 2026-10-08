import Link from "next/link";
import type { ReactNode } from "react";
import { UniversityLogo } from "@/components/university-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // Yuqoridan qat’iy bo‘shliq: karta balandligi o‘zgarganda (forma → tasdiqlash) logo joyida qoladi
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-10 pb-12 sm:pt-20">
      <UniversityLogo className="mx-auto w-32 sm:w-40" />
      {/* Kirish, ro‘yxatdan o‘tish va Telegram tasdiqlash bosqichi bir xil kartada */}
      <div className="mt-8 rounded-2xl border border-line bg-paper p-6 sm:mt-10 sm:p-8">{children}</div>
      <Link href="/" className="mx-auto mt-6 text-sm text-muted hover:text-ink">
        Bosh sahifa
      </Link>
    </main>
  );
}
