"use client";

import { SiteBrand } from "@/components/site-brand";
import { useLang } from "@/i18n/use-lang";

/** Ommaviy sahifalar header’i uchun: brend sahifa tilida (til manzildan, sahifa prop bermaydi) */
export function PublicBrand() {
  return <SiteBrand lang={useLang()} />;
}
