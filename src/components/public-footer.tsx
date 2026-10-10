"use client";

import Link from "next/link";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { SiteBrand } from "@/components/site-brand";
import { commonText } from "@/i18n/common";
import { localePath } from "@/i18n/lang";
import { useLang } from "@/i18n/use-lang";
import { SERVICE_NAME, UNIVERSITY_NAME } from "@/lib/brand";

const LINKS = [
  { href: "/maqolalar", key: "articles" },
  { href: "/mualliflar", key: "authors" },
  { href: "/yonalishlar", key: "directions" },
  { href: "/yangiliklar", key: "news" },
  { href: "/haqida", key: "about" },
  { href: "/login", key: "login" },
] as const;

/**
 * Ommaviy sahifalar footer’i: brend, bo‘limlar va kichik yozuv; lg dan bir qator. Matn va havolalar sahifa tilida.
 * Yil yozilmaydi: statik sahifada new Date() prerender vaqtida qotib qolardi.
 */
export function PublicFooter() {
  const lang = useLang();
  const t = commonText[lang];
  return (
    <footer className="border-t border-line bg-paper">
      <div className={`flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8 ${PUBLIC_WIDTH}`}>
        <div className="shrink-0">
          <SiteBrand />
        </div>
        {/* O‘ng ustun: bo‘limlar va ostida kichik yozuv — brend balandligidan oshmaydi, footer lg’da bir qator bo‘lib qoladi */}
        <div className="flex flex-col gap-2 lg:items-end">
          <nav aria-label={t.publicFooter.navLabel} className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {LINKS.map((l) => (
              <Link key={l.href} href={localePath(lang, l.href)} className="text-muted hover:text-ink">
                {t.publicHeader[l.key]}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted">{t.publicFooter.copyright(UNIVERSITY_NAME, SERVICE_NAME)}</p>
        </div>
      </div>
    </footer>
  );
}
