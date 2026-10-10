"use client";

import { usePathname } from "next/navigation";
import { commonText } from "@/i18n/common";
import { localePath, stripLang } from "@/i18n/lang";
import { useLang } from "@/i18n/use-lang";
import { LANG_LABELS, LANGS } from "@/lib/langs";

/**
 * Tillar ro‘yxati: kod, o‘z tilidagi nomi, joriysida belgi. Havolalar oddiy <a> — sahifa to‘liq qayta yuklanadi va
 * <html>, metama’lumot va matn butunlay yangi tilda keladi. Joriy sahifaning o‘zi boshqa tilda ochiladi.
 */
export function LangLinks({ className = "" }: { className?: string }) {
  const lang = useLang();
  const path = stripLang(usePathname());
  return LANGS.map((l) => (
    <li key={l} className={className}>
      <a
        href={localePath(l, path)}
        hrefLang={l}
        lang={l}
        aria-current={l === lang ? "true" : undefined}
        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-mist aria-[current=true]:font-semibold aria-[current=true]:text-lapis"
      >
        <span aria-hidden="true" className="w-6 text-xs font-semibold text-muted uppercase">
          {l}
        </span>
        {LANG_LABELS[l]}
        {l === lang && (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-auto size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </a>
    </li>
  ));
}

/** Header’dagi globus tugmasi: ochiladigan ro‘yxat (details — JS’siz ochiladi, ☰ menyu bilan bir xil) */
export function LangSwitcher({ className = "" }: { className?: string }) {
  const lang = useLang();
  return (
    <details className={`relative ${className}`}>
      <summary
        aria-label={`${commonText[lang].switcher.label}: ${LANG_LABELS[lang]}`}
        className="btn btn-ghost list-none px-2 [&::-webkit-details-marker]:hidden"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
        </svg>
      </summary>
      <ul className="absolute top-full right-0 z-20 mt-2 w-48 rounded-xl border border-line bg-paper p-1.5 text-sm shadow-lg">
        <LangLinks />
      </ul>
    </details>
  );
}
