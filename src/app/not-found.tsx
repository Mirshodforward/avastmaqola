import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PUBLIC_WIDTH } from "@/components/public-width";

export const metadata: Metadata = { title: "Sahifa topilmadi" };

/**
 * 404: yo‘q manzil, chop etilmagan yoki olib tashlangan maqola, profil va yangilik. Ommaviy sahifalar header va footer’i
 * bilan; ma’lumot o‘qilmaydi (statik). Status 404 va noindex’ni Next o‘zi qo‘yadi.
 */
export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Sahifa topilmadi</h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary btn-lg">
            Bosh sahifa
          </Link>
          <Link href="/maqolalar" className="btn btn-secondary btn-lg">
            Maqolalar
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
