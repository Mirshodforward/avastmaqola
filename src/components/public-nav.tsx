"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Ommaviy bo‘limlar. match — bo‘limga tegishli ichki sahifalar (maqola, o‘qituvchi) ham belgilanadi */
const SECTIONS = [
  { href: "/maqolalar", label: "Maqolalar", match: ["/maqolalar", "/maqola/"] },
  { href: "/mualliflar", label: "Mualliflar", match: ["/mualliflar", "/oqituvchi/"] },
  { href: "/yonalishlar", label: "Yo‘nalishlar", match: ["/yonalishlar"] },
  { href: "/yangiliklar", label: "Yangiliklar", match: ["/yangiliklar"] },
  { href: "/haqida", label: "Portal haqida", match: ["/haqida"] },
];

const ACTIVE = "aria-[current=page]:bg-mist aria-[current=page]:font-semibold";

/** Shu sahifaning o‘zi bosilganda navigatsiya bo‘lmaydi va key o‘zgarmaydi — menyu qo‘lda yopiladi */
const closeMenu = (e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.closest("details")?.removeAttribute("open");

/**
 * Barcha ommaviy sahifalar header’idagi bitta menyu (en hamma joyda PUBLIC_WIDTH). Bo‘limlar lg’dan qatorda,
 * yonida faqat "Kirish" (~870px). "Ro‘yxatdan o‘tish" qator yonida sig‘maydi: u sm–lg’da ☰ yonida, telefonda
 * ☰ ichida, keng ekranda esa bosh sahifa hero’si, pastki chaqiriq bloki va kirish sahifasida bor.
 */
export function PublicNav() {
  const pathname = usePathname();
  const current = (match: string[]) => (match.some((m) => pathname.startsWith(m)) ? "page" : undefined);

  return (
    <nav aria-label="Asosiy" className="flex items-center gap-1 sm:gap-2">
      <ul className="hidden items-center gap-1 lg:flex">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} aria-current={current(s.match)} className={`btn btn-ghost px-3 ${ACTIVE}`}>
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/login" className="btn btn-secondary hidden sm:inline-flex">
        Kirish
      </Link>
      <Link href="/register" className="btn btn-primary hidden sm:inline-flex lg:hidden">
        Ro‘yxatdan o‘tish
      </Link>

      {/* Torroq ekranlar: ☰ menyu. details JS’siz ochiladi; key={pathname} — sahifa almashganda yopiq holda qayta chiziladi */}
      <details key={pathname} className="relative lg:hidden">
        <summary aria-label="Menyu" className="btn btn-ghost list-none px-3 [&::-webkit-details-marker]:hidden">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </summary>
        <ul className="absolute top-full right-0 z-20 mt-2 w-60 rounded-xl border border-line bg-paper p-2 shadow-lg">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={current(s.match)}
                onClick={closeMenu}
                className={`block rounded-lg px-3 py-2 hover:bg-mist ${ACTIVE}`}
              >
                {s.label}
              </Link>
            </li>
          ))}
          {/* Kirish tugmalari header’da faqat sm dan ko‘rinadi — undan torda menyu ichida, chiziq bilan ajratilgan */}
          <li className="mt-2 border-t border-line pt-2 sm:hidden">
            <Link href="/login" onClick={closeMenu} className="block rounded-lg px-3 py-2 font-medium hover:bg-mist">
              Kirish
            </Link>
          </li>
          <li className="sm:hidden">
            <Link href="/register" onClick={closeMenu} className="block rounded-lg px-3 py-2 font-medium hover:bg-mist">
              Ro‘yxatdan o‘tish
            </Link>
          </li>
        </ul>
      </details>
    </nav>
  );
}
