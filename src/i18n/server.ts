import "server-only";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/langs";
import { isLang } from "./lang";

/** [lang] ostidagi sahifa va layout’lar uchun: noma’lum til — 404 */
export async function pageLang(params: Promise<{ lang: string }>): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}
