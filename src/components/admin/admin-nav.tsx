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

/** Admin bo‘limlari. current berilmasa (masalan, maqola sahifasida) hech bir tab tanlanmaydi. */
export function AdminNav({ current }: { current?: AdminTab }) {
  return (
    <nav aria-label="Admin panel bo‘limlari" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line text-sm">
        {TABS.map((tab) => (
          <li key={tab.key}>
            <Link
              href={tab.href}
              aria-current={tab.key === current ? "page" : undefined}
              className="-mb-px inline-block border-b-2 border-transparent px-3 py-2.5 font-medium text-muted transition-colors hover:text-ink focus-visible:-outline-offset-2 aria-[current=page]:border-lapis aria-[current=page]:text-ink"
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
