import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import type { Lang } from "@/lib/langs";
import { DEFAULT_LANG, isLang } from "./lang";

const noSubscribe = () => () => {};
const pathPrefix = () => location.pathname.split("/")[1];

/**
 * Mijoz komponentlari uchun joriy til: [lang] segmentidan (/ru, /en), prefikssiz sahifada — o‘zbekcha.
 * Mos kelmagan manzilning 404 sahifasi [lang] segmentidan tashqarida va oldindan o‘zbekcha chizilgan (params bo‘sh):
 * til manzil prefiksidan, lekin faqat gidratatsiyadan keyin — server HTML’i bilan farq React #418 xatosini berardi.
 * usePathname yo‘q: navigatsiya hook’i Suspense fallback’ida build’ni buzadi (reference-fallback-hooks-build).
 */
export function useLang(): Lang {
  const { lang } = useParams<{ lang?: string }>();
  const fromPath = useSyncExternalStore(noSubscribe, pathPrefix, () => undefined);
  if (isLang(lang)) return lang;
  return isLang(fromPath) ? fromPath : DEFAULT_LANG;
}
