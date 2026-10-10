import Link from "next/link";
import { AsmanMark } from "@/components/asman-mark";
import { commonText } from "@/i18n/common";
import { localePath } from "@/i18n/lang";
import { UNIVERSITY_NAME } from "@/lib/brand";
import type { Lang } from "@/lib/langs";

/**
 * Portal nomi: Asman belgisi va universitet nomi. Bosh sahifa va ommaviy sahifalar header’i, footer va kabinetda.
 * Hook yo‘q (til prop bilan): kabinetning Suspense fallback’ida ham chiziladi — u yerda useParams build’da osilib qolardi.
 * Til faqat klientda ma’lum bo‘lgan joylar uchun — PublicBrand.
 */
export function SiteBrand({ lang = "uz" }: { lang?: Lang }) {
  return (
    <Link href={localePath(lang, "/")} className="flex items-center gap-3">
      <AsmanMark className="h-10 w-auto" />
      <span className="leading-tight">
        <span className="block font-serif text-lg font-semibold">{UNIVERSITY_NAME}</span>
        <span className="block text-sm text-muted">{commonText[lang].siteBrand.tagline}</span>
      </span>
    </Link>
  );
}
