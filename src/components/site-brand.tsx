import Link from "next/link";
import { AsmanMark } from "@/components/asman-mark";
import { UNIVERSITY_NAME } from "@/lib/brand";

/** Portal nomi: Asman belgisi va universitet nomi. Bosh sahifa va ommaviy sahifalar header’i hamda footer’da. */
export function SiteBrand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <AsmanMark className="h-10 w-auto" />
      <span className="leading-tight">
        <span className="block font-serif text-lg font-semibold">{UNIVERSITY_NAME}</span>
        <span className="block text-sm text-muted">Ilmiy maqolalar portali</span>
      </span>
    </Link>
  );
}
