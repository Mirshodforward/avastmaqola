"use client";

import type { ReactNode } from "react";
import { useLang } from "@/i18n/use-lang";

/** [lang]/layout’dagi til o‘rami o‘rnida — u yerdan tashqarida chiziladigan sahifa uchun (mos kelmagan manzilning 404’i) */
export function LangScope({ children }: { children: ReactNode }) {
  return (
    <div lang={useLang()} className="contents">
      {children}
    </div>
  );
}
