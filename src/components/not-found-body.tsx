"use client";

import Link from "next/link";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { localePath } from "@/i18n/lang";
import { notFoundText } from "@/i18n/page-not-found";
import { useLang } from "@/i18n/use-lang";

/**
 * 404 matni va havolalari sahifa tilida. not-found.tsx params olmaydi — til [lang] segmentidan (useLang, header kabi):
 * /ru sahifasidagi notFound() ruscha. <main lang>: 404 [lang]/layout’dagi til o‘rami ichida chizilmaydi.
 */
export function NotFoundBody() {
  const lang = useLang();
  const t = notFoundText[lang];
  return (
    <main lang={lang} className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.title}</h1>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={localePath(lang, "/")} className="btn btn-primary btn-lg">
          {t.home}
        </Link>
        <Link href={localePath(lang, "/maqolalar")} className="btn btn-secondary btn-lg">
          {t.articles}
        </Link>
      </div>
    </main>
  );
}
