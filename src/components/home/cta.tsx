import Link from "next/link";
import { PUBLIC_WIDTH } from "@/components/public-width";

/** Sahifa oxiridagi chaqiriq: o‘qib chiqqan o‘qituvchi tepaga qaytmasdan ro‘yxatdan o‘tadi */
export function HomeCta() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-lapis text-on-lapis">
      {/* Ufqdan ko‘tarilayotgan nurlar: konsentrik yoylar, faqat bezak */}
      <svg
        aria-hidden="true"
        viewBox="0 0 640 320"
        className="pointer-events-none absolute right-0 bottom-0 h-full w-auto max-w-none opacity-15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {[90, 170, 250, 330, 410, 490].map((r) => (
          <circle key={r} cx="640" cy="320" r={r} />
        ))}
      </svg>
      <div className={`relative grid gap-8 py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:py-28 ${PUBLIC_WIDTH}`}>
        <h2 id="cta-title" className="max-w-2xl font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
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
