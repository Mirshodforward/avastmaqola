import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Lang } from "@/lib/langs";

export type ArticleListEntry = {
  id: number;
  title: string;
  /** Sarlavha tili: rus va ingliz sarlavhalari ekran o‘quvchida o‘z tilida o‘qilsin */
  lang: Lang;
  byline: string;
  publishedAt: Date | null;
  /** Portaldagi joyi: "3-son", "12-maqola" (raqamni moderator belgilaguncha bo‘lmasligi mumkin) */
  issueNo: number;
  issueSeq: number | null;
  /** "Journal 2(11), 119–122" — maqola jurnal yoki konferensiya to‘plamida chiqqan bo‘lsa */
  venue: string | null;
  /** Asl nashr yili, bo‘lmasa saytda chop etilgan yil */
  year: number;
};

/**
 * Maqolalar ro‘yxati — bosh sahifadagi kartalar bilan bir xil: chapda sondagi joyi, o‘ngda sana, sarlavha va mualliflar.
 * Faqat sarlavha havolasi, annotatsiyasiz (Scholar bir sahifada bir nechta annotatsiyani yoqtirmaydi). Katalogda sarlavha
 * qisqartirilmaydi. withYear — Google Scholar profilidagidek: sana o‘rnida asl nashr yili.
 */
export function ArticleList({ items, withYear = false }: { items: ArticleListEntry[]; withYear?: boolean }) {
  return (
    // role="list": Tailwind list-style:none Safari/VoiceOver’da ro‘yxat ma’nosini olib tashlaydi
    <ol role="list" className="grid gap-4 lg:grid-cols-2">
      {items.map((a) => (
        // Havola faqat sarlavhada, bosiladigan joy esa butun karta (after); fokus halqasi butun karta atrofida
        <li
          key={a.id}
          className="group relative flex overflow-hidden rounded-xl border border-line bg-paper transition-colors hover:border-lapis/50 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-tile"
        >
          <div className="flex w-28 shrink-0 flex-col justify-between gap-2 border-r border-line bg-mist p-3 sm:w-32 sm:p-4">
            {/* whitespace-nowrap: "6-maqola" defisdan keyin ikki qatorga bo‘linib qolmasin */}
            <p className="text-xs whitespace-nowrap text-muted tabular-nums">{a.issueNo}-son</p>
            {a.issueSeq && (
              <p className="font-serif text-sm leading-tight font-semibold whitespace-nowrap text-lapis tabular-nums sm:text-base">
                {a.issueSeq}-maqola
              </p>
            )}
          </div>
          {/* break-words: uzun bo‘linmas so‘z (formula, havola) telefonda kartani kengaytirmasin */}
          <div className="flex min-w-0 flex-1 flex-col p-4 break-words sm:p-5">
            {withYear ? (
              <time dateTime={String(a.year)} className="text-sm text-muted tabular-nums">
                {a.year}
              </time>
            ) : (
              a.publishedAt && (
                <time dateTime={new Date(a.publishedAt).toISOString()} className="text-sm text-muted">
                  {formatDate(a.publishedAt)}
                </time>
              )
            )}
            <h3 lang={a.lang} className="mt-1 font-serif text-lg leading-snug font-semibold">
              <Link href={`/maqola/${a.id}`} className="group-hover:text-lapis after:absolute after:inset-0 focus-visible:outline-none!">
                {a.title}
              </Link>
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{a.byline}</p>
            {a.venue && <p className="mt-1 text-sm text-muted">{a.venue}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
