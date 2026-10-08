import Link from "next/link";
import { SiteBrand } from "@/components/site-brand";

/**
 * Ommaviy sahifalar (maqola, ro‘yxat, o‘qituvchi profili) sarlavhasi — bosh sahifadagi bilan bir xil belgi.
 * Universitet nomi maqola sarlavhasidan (h1) ancha kichik: Scholar sarlavha va mualliflarni meta teglardan oladi.
 */
export function PublicHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <SiteBrand />
        {/* 390px ekranda belgi bilan sig‘ishi uchun "Kirish" faqat sm dan (o‘qituvchi bosh sahifadan kiradi) */}
        <nav aria-label="Asosiy" className="flex items-center gap-1 text-sm">
          <Link href="/maqolalar" className="btn btn-ghost px-3">
            Maqolalar
          </Link>
          <Link href="/login" className="btn btn-ghost hidden px-3 sm:inline-flex">
            Kirish
          </Link>
        </nav>
      </div>
    </header>
  );
}
