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

/**
 * Bo‘limlar qaysi kenglikdan qatorda (flex) ko‘rinadi. Ichki sahifalarda konteyner max-w-5xl: bo‘limlar xl’dan,
 * yonida faqat "Kirish" sig‘adi ("Ro‘yxatdan o‘tish" esa ☰ bilan birga torroq ekranda). Bosh sahifa markazlashgan
 * (HOME_WIDTH, chetlarda 15–20% joy): bo‘limlar lg’dan qatorda, yonida faqat "Kirish" — "Ro‘yxatdan o‘tish"
 * header’ga sig‘maydi, u hero va pastdagi chaqiriq blokida bor (telefonda ☰ menyuda).
 */
const LAYOUT = {
  page: { row: "hidden xl:flex", menu: "relative xl:hidden", register: "hidden sm:inline-flex xl:hidden" },
  home: { row: "hidden lg:flex", menu: "relative lg:hidden", register: "hidden" },
};

/** Shu sahifaning o‘zi bosilganda navigatsiya bo‘lmaydi va key o‘zgarmaydi — menyu qo‘lda yopiladi */
const closeMenu = (e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.closest("details")?.removeAttribute("open");

/** Bosh sahifa va ommaviy sahifalar header’idagi bitta menyu: keng ekranda qatorda, torroq ekranda ochiladigan ro‘yxat */
export function PublicNav({ home = false }: { home?: boolean }) {
  const pathname = usePathname();
  const current = (match: string[]) => (match.some((m) => pathname.startsWith(m)) ? "page" : undefined);
  const layout = home ? LAYOUT.home : LAYOUT.page;

  return (
    <nav aria-label="Asosiy" className="flex items-center gap-1 sm:gap-2">
      <ul className={`items-center gap-1 ${layout.row}`}>
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
      <Link href="/register" className={`btn btn-primary ${layout.register}`}>
        Ro‘yxatdan o‘tish
      </Link>

      {/* Torroq ekranlar: ☰ menyu. details JS’siz ochiladi; key={pathname} — sahifa almashganda yopiq holda qayta chiziladi */}
      <details key={pathname} className={layout.menu}>
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
