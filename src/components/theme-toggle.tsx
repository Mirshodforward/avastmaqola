"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { commonText } from "@/i18n/common";
import type { Lang } from "@/lib/langs";

const KEY = "theme";

/** Saqlangan tanlov, bo‘lmasa tizim sozlamasi — layout’dagi skript bilan bir xil qoida */
function resolve() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.dataset.theme === "dark";

/**
 * Kun/tun rejimi. Mavzu <html data-theme> da: sahifa chizilishidan oldin layout’dagi skript qo‘yadi, tugma almashtiradi
 * va tanlovni saqlaydi. Oy/quyosh CSS bilan (dark:) — server HTML’i hamma uchun bir xil, miltillash yo‘q.
 * label — menyu ichidagi yozuvli qator. lang prop bilan (useParams emas): kabinetning Suspense fallback’ida ham
 * chiziladi, u yerda navigatsiya hook’i build’da statik shell’ni bo‘sh qoldirardi.
 */
export function ThemeToggle({ label = false, className = "", lang = "uz" }: { label?: boolean; className?: string; lang?: Lang }) {
  const text = commonText[lang].themeToggle.label;
  // Server va gidratatsiyada noma’lum (aria-pressed chiqmaydi), keyin haqiqiy holat
  const dark = useSyncExternalStore(subscribe, isDark, () => undefined);

  // Dev’dagi Strict Mode qayta o‘rnatishi <html> atributlarini tozalaydi — qayta qo‘yamiz (production’da hech narsa qilmaydi)
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!root.dataset.theme) root.dataset.theme = resolve();
  }, []);

  function toggle() {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Saqlash yopiq (maxfiy oyna): tanlov shu sahifada ishlaydi
    }
  }

  // Kunduzi oy (tunga o‘tish), tunda quyosh
  const icons = (
    <>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="hidden size-5 dark:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
      </svg>
    </>
  );

  if (label) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={dark}
        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-mist ${className}`}
      >
        {text}
        {icons}
      </button>
    );
  }
  return (
    <button type="button" onClick={toggle} aria-pressed={dark} aria-label={text} className={`btn btn-ghost px-2 ${className}`}>
      {icons}
    </button>
  );
}
