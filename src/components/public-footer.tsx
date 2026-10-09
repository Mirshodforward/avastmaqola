import Link from "next/link";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { SiteBrand } from "@/components/site-brand";
import { SERVICE_NAME, UNIVERSITY_NAME } from "@/lib/brand";

const LINKS = [
  { href: "/maqolalar", label: "Maqolalar" },
  { href: "/mualliflar", label: "Mualliflar" },
  { href: "/yonalishlar", label: "Yo‘nalishlar" },
  { href: "/yangiliklar", label: "Yangiliklar" },
  { href: "/haqida", label: "Portal haqida" },
  { href: "/login", label: "Kirish" },
];

/**
 * Ommaviy sahifalar footer’i: brend, bo‘limlar va kichik yozuv; lg dan bir qator.
 * Yil yozilmaydi: statik sahifada new Date() prerender vaqtida qotib qolardi.
 */
export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className={`flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8 ${PUBLIC_WIDTH}`}>
        <div className="shrink-0">
          <SiteBrand />
        </div>
        {/* O‘ng ustun: bo‘limlar va ostida kichik yozuv — brend balandligidan oshmaydi, footer lg’da bir qator bo‘lib qoladi */}
        <div className="flex flex-col gap-2 lg:items-end">
          <nav aria-label="Bo‘limlar" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-muted hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted">
            © {UNIVERSITY_NAME}. {SERVICE_NAME} xizmati asosida ishlaydi.
          </p>
        </div>
      </div>
    </footer>
  );
}
