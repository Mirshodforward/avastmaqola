import Link from "next/link";
import { formatDate } from "@/lib/format";

export type ArticleListEntry = {
  id: number;
  title: string;
  byline: string;
  publishedAt: Date | null;
  /** "Journal 2(11), 119–122" — maqola jurnal yoki konferensiya to‘plamida chiqqan bo‘lsa */
  venue: string | null;
  /** Asl nashr yili, bo‘lmasa saytda chop etilgan yil */
  year: number;
};

/**
 * Maqolalar ro‘yxati: faqat sarlavha havolalari (Scholar bir sahifada bir nechta annotatsiyani yoqtirmaydi).
 * withYear — Google Scholar profilidagidek jadval: yil o‘ng ustunda, sana o‘rniga.
 */
export function ArticleList({ items, withYear = false }: { items: ArticleListEntry[]; withYear?: boolean }) {
  if (!withYear) {
    return (
      <ol className="divide-y divide-line border-y border-line break-words">
        {items.map((item) => (
          <li key={item.id} className="py-4">
            <Entry item={item} withDate />
          </li>
        ))}
      </ol>
    );
  }
  // table-fixed: uzun bo‘linmas so‘z ustunni kengaytirib, telefonda sahifani yon tomonga surmasin
  return (
    <table className="w-full table-fixed break-words">
      <thead>
        <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
          <th scope="col" className="pb-2 text-left font-medium">
            Sarlavha
          </th>
          <th scope="col" className="w-16 pb-2 text-right font-medium">
            Yil
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line border-b border-line">
        {items.map((item) => (
          <tr key={item.id}>
            <td className="py-4 align-baseline">
              <Entry item={item} />
            </td>
            <td className="py-4 text-right align-baseline text-sm tabular-nums text-muted">{item.year}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Entry({ item, withDate = false }: { item: ArticleListEntry; withDate?: boolean }) {
  return (
    <>
      <Link href={`/maqola/${item.id}`} className="font-serif text-lg font-semibold leading-snug hover:text-lapis">
        {item.title}
      </Link>
      <p className="mt-1 text-sm text-muted">
        {item.byline}
        {withDate && item.publishedAt && (
          <>
            {", "}
            <time dateTime={new Date(item.publishedAt).toISOString()}>{formatDate(item.publishedAt)}</time>
          </>
        )}
      </p>
      {item.venue && <p className="text-sm text-muted">{item.venue}</p>}
    </>
  );
}
