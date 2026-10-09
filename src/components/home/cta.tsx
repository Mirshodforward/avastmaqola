import Link from "next/link";
import { PUBLIC_WIDTH } from "@/components/public-width";

/** Sahifa oxiridagi chaqiriq: o‘qib chiqqan o‘qituvchi tepaga qaytmasdan ro‘yxatdan o‘tadi */
export function HomeCta() {
  return (
    <section aria-labelledby="cta-title" className="bg-lapis text-on-lapis">
      <div className={`reveal flex flex-col items-start gap-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20 ${PUBLIC_WIDTH}`}>
        <h2 id="cta-title" className="max-w-2xl font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Maqolangizni portalga joylang
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="btn btn-lg bg-paper text-lapis hover:bg-mist">
            Ro‘yxatdan o‘tish
          </Link>
          <Link href="/login" className="btn btn-lg border-on-lapis/40 text-on-lapis hover:bg-on-lapis/10">
            Kirish
          </Link>
        </div>
      </div>
    </section>
  );
}
