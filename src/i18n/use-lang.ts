import { useParams } from "next/navigation";
import type { Lang } from "@/lib/langs";
import { DEFAULT_LANG, isLang } from "./lang";

/** Mijoz komponentlari uchun joriy til: [lang] segmentidan (/ru, /en), prefikssiz sahifada — o‘zbekcha */
export function useLang(): Lang {
  const { lang } = useParams<{ lang?: string }>();
  return isLang(lang) ? lang : DEFAULT_LANG;
}
