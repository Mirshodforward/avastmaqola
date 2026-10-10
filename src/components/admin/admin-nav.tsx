import Link from "next/link";

const TABS = [
  { key: "overview", href: "/admin", label: "Umumiy" },
  { key: "queue", href: "/admin/queue", label: "Navbat" },
  { key: "articles", href: "/admin/articles", label: "Maqolalar" },
  { key: "ratings", href: "/admin/iqtiboslar", label: "Iqtiboslar" },
  { key: "teachers", href: "/admin/teachers", label: "O‘qituvchilar" },
  { key: "news", href: "/admin/yangiliklar", label: "Yangiliklar" },
  { key: "ai", href: "/admin/ai", label: "AI so‘rovlar" },
] as const;

export type AdminTab = (typeof TABS)[number]["key"];

/**
 * Admin bo‘limlari. current berilmasa hech bir tab tanlanmaydi.
 * Tor ekranda tablar yashirin surilmaydi — keyingi qatorga o‘raladi, hammasi ko‘rinib turadi. Chiziq har tab ostida,
 * oxirgi qatorning bo‘sh qismini ::after to‘ldiradi (grow-[99]): har qator ostida yaxlit chiziq, tablar deyarli o‘z enida.
 * Fokus halqasi tab ichida (! — globals.css’dagi qatlamsiz :focus-visible qoidasidan ustun bo‘lishi uchun).
 */
export function AdminNav({ current }: { current?: AdminTab }) {
  return (
    <nav aria-label="Admin panel bo‘limlari">
      <ul className="flex flex-wrap text-sm after:grow-[99] after:border-b after:border-line after:content-['']">
        {TABS.map((tab) => (
          <li key={tab.key} className="grow border-b border-line">
            <Link
              href={tab.href}
              aria-current={tab.key === current ? "page" : undefined}
              className="-mb-px block border-b-2 border-transparent px-3 py-2.5 text-center font-medium text-muted transition-colors hover:text-ink focus-visible:-outline-offset-2! aria-[current=page]:border-lapis aria-[current=page]:text-ink"
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
