import Link from "next/link";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { homeText } from "@/i18n/home";
import type { Lang } from "@/lib/langs";
import { seq } from "./motion";

/**
 * Sahifa oxiridagi chaqiriq: o‘qib chiqqan o‘qituvchi tepaga qaytmasdan ro‘yxatdan o‘tadi.
 * Harakat: blok ko‘rinishga kirganda yoylar birin-ketin chiziladi (ufqdan chiqayotgan nurlar),
 * sarlavha va tugmalar ko‘tarilib chiqadi — hammasi blokning o‘z vaqt chizig‘ida (vt-grp / tl-grp).
 */
export function HomeCta({ lang }: { lang: Lang }) {
  const t = homeText[lang];
  return (
    <section aria-labelledby="cta-title" className="vt-grp relative overflow-hidden bg-lapis text-on-lapis">
      {/* Ufqdan ko‘tarilayotgan nurlar: konsentrik yoylar, faqat bezak */}
      <svg
        aria-hidden="true"
        viewBox="0 0 640 320"
        className="pointer-events-none absolute right-0 bottom-0 h-full w-auto max-w-none opacity-15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {[90, 170, 250, 330, 410, 490].map((r, i) => (
          <circle key={r} cx="640" cy="320" r={r} pathLength={1} className="m-stroke tl-grp" style={seq(i)} />
        ))}
      </svg>
      <div className={`relative grid gap-8 py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:py-28 ${PUBLIC_WIDTH}`}>
        <h2 id="cta-title" className="m-rise tl-grp max-w-2xl font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {t.cta.title}
        </h2>
        <div className="m-rise tl-grp flex flex-wrap gap-3" style={seq(1)}>
          <Link href="/register" className="btn btn-lg bg-paper text-lapis hover:bg-mist">
            {t.homePage.register}
          </Link>
          <Link href="/login" className="btn btn-lg border-on-lapis/40 text-on-lapis hover:bg-on-lapis/10">
            {t.homePage.login}
          </Link>
        </div>
      </div>
    </section>
  );
}
