"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/i18n/lang";
import { useLang } from "@/i18n/use-lang";

/**
 * Ichki havola sahifa tilida: /ru sahifasida "/maqolalar" → "/ru/maqolalar". Kabinet, kirish, API va PDF yo‘llari
 * prefikssiz qoladi (localePath). Til prop bilan kelmaydigan umumiy komponentlar uchun.
 */
export function LocalLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  return <Link href={localePath(useLang(), href)} {...props} />;
}
