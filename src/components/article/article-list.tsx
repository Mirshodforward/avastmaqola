import Link from "next/link";
import { formatDate } from "@/lib/format";

export type ArticleListEntry = { id: number; title: string; byline: string; publishedAt: Date | null };

/** Maqolalar ro‘yxati: faqat sarlavha havolalari (Scholar bir sahifada bir nechta annotatsiyani yoqtirmaydi) */
export function ArticleList({ items }: { items: ArticleListEntry[] }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item.id} className="py-4">
          <Link href={`/maqola/${item.id}`} className="font-serif text-lg font-semibold leading-snug hover:text-lapis">
            {item.title}
          </Link>
          <p className="mt-1 text-sm text-muted">
            {item.byline}
            {item.publishedAt && (
              <>
                {", "}
                <time dateTime={new Date(item.publishedAt).toISOString()}>{formatDate(item.publishedAt)}</time>
              </>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}
