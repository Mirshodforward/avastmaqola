"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessionUser } from "@/components/auth/use-session-user";
import { UserMenu } from "@/components/dashboard/user-menu";
import { LangLinks, LangSwitcher } from "@/components/lang-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { commonText } from "@/i18n/common";
import { localePath, stripLang } from "@/i18n/lang";
import { useLang } from "@/i18n/use-lang";

/** Ommaviy bo‘limlar. match — bo‘limga tegishli ichki sahifalar (maqola, o‘qituvchi) ham belgilanadi */
const SECTIONS = [
  { href: "/maqolalar", key: "articles", match: ["/maqolalar", "/maqola/"] },
  { href: "/mualliflar", key: "authors", match: ["/mualliflar", "/oqituvchi/"] },
  { href: "/yonalishlar", key: "directions", match: ["/yonalishlar"] },
  { href: "/yangiliklar", key: "news", match: ["/yangiliklar"] },
  { href: "/haqida", key: "about", match: ["/haqida"] },
] as const;

const ACTIVE = "aria-[current=page]:bg-mist aria-[current=page]:font-semibold";

/** Shu sahifaning o‘zi bosilganda navigatsiya bo‘lmaydi va key o‘zgarmaydi — menyu qo‘lda yopiladi */
const closeMenu = (e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.closest("details")?.removeAttribute("open");

/**
 * Barcha ommaviy sahifalar header’idagi bitta menyu (en hamma joyda PUBLIC_WIDTH). Bo‘limlar lg’dan qatorda,
 * yonida til, kun/tun va "Kirish". "Ro‘yxatdan o‘tish" qator yonida sig‘maydi: u sm–lg’da ☰ yonida, telefonda
 * ☰ ichida, keng ekranda esa bosh sahifa hero’si, pastki chaqiriq bloki va kirish sahifasida bor.
 * Matn va havolalar sahifa tilida ([lang] segmenti): /ru sahifasidagi bo‘lim /ru/... ga olib boradi.
 */
export function PublicNav() {
  const pathname = usePathname();
  const lang = useLang();
  const t = commonText[lang].publicHeader;
  // Sahifa statik — kim kirganini klient so‘raydi. Javob kelguncha "Kirish" turadi, keyin rasm bilan almashadi
  const me = useSessionUser();
  // Faol bo‘lim til prefiksisiz yo‘l bo‘yicha ("/ru/maqola/5" → "/maqola/5")
  const path = stripLang(pathname);
  const current = (match: readonly string[]) => (match.some((m) => path.startsWith(m)) ? "page" : undefined);

  return (
    <nav aria-label={t.navLabel} className="flex items-center gap-1 sm:gap-2">
      {/* Zich (px-2, gap-0.5): 1280px’da (xl, en 896px) bo‘limlar, til, kun/tun va "Kirish" brend bilan bir qatorga sig‘sin */}
      <ul className="hidden items-center gap-0.5 lg:flex">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link href={localePath(lang, s.href)} aria-current={current(s.match)} className={`btn btn-ghost px-2 ${ACTIVE}`}>
              {t[s.key]}
            </Link>
          </li>
        ))}
      </ul>
      {/* md dan torda qatorga sig‘maydi — ☰ menyu ichida */}
      <LangSwitcher className="hidden md:block" />
      <ThemeToggle className="hidden md:inline-flex" />
      {me ? (
        <UserMenu name={me.name} photoUrl={me.photoUrl} admin={me.role === "admin"} moderator={me.role === "moderator"} compact />
      ) : (
        <>
          <Link href="/login" className="btn btn-secondary hidden sm:inline-flex">
            {t.login}
          </Link>
          <Link href="/register" className="btn btn-primary hidden sm:inline-flex lg:hidden">
            {t.register}
          </Link>
        </>
      )}

      {/* Torroq ekranlar: ☰ menyu. details JS’siz ochiladi; key={pathname} — sahifa almashganda yopiq holda qayta chiziladi */}
      <details key={pathname} className="relative lg:hidden">
        <summary aria-label={t.menu} className="btn btn-ghost list-none px-3 [&::-webkit-details-marker]:hidden">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </summary>
        <ul className="absolute top-full right-0 z-20 mt-2 w-60 rounded-xl border border-line bg-paper p-2 shadow-lg">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={localePath(lang, s.href)}
                aria-current={current(s.match)}
                onClick={closeMenu}
                className={`block rounded-lg px-3 py-2 hover:bg-mist ${ACTIVE}`}
              >
                {t[s.key]}
              </Link>
            </li>
          ))}
          {/* Kirish tugmalari header’da faqat sm dan ko‘rinadi — undan torda menyu ichida, chiziq bilan ajratilgan.
              Kirgan foydalanuvchiga ular o‘rnida kabinet havolasi */}
          {me ? (
            <li className="mt-2 border-t border-line pt-2 sm:hidden">
              <Link href="/dashboard" onClick={closeMenu} className="block rounded-lg px-3 py-2 font-medium hover:bg-mist">
                {commonText[lang].dashboardShell.dashboard}
              </Link>
            </li>
          ) : (
            <>
              <li className="mt-2 border-t border-line pt-2 sm:hidden">
                <Link href="/login" onClick={closeMenu} className="block rounded-lg px-3 py-2 font-medium hover:bg-mist">
                  {t.login}
                </Link>
              </li>
              <li className="sm:hidden">
                <Link href="/register" onClick={closeMenu} className="block rounded-lg px-3 py-2 font-medium hover:bg-mist">
                  {t.register}
                </Link>
              </li>
            </>
          )}
          <li className="mt-2 border-t border-line pt-2 md:hidden">
            <ThemeToggle label />
          </li>
          <LangLinks className="md:hidden" />
        </ul>
      </details>
    </nav>
  );
}
