import Link from "next/link";
import { localePath } from "@/i18n/lang";
import { formatDate } from "@/lib/format";
import type { Lang } from "@/lib/langs";
import type { ArticleRatings, RatingItem } from "@/server/ratings/service";
import { RATING_DIALOG_ID, RatingDialog } from "./rating-dialog";
import { Stars } from "./stars";
import { formatAverage, ratingText } from "./text";

/** Ochiq turadigan iqtiboslar soni; qolganlari "Yana N ta" ostida — baribir statik HTML’da, har biri bir marta */
const VISIBLE = 3;

/**
 * Maqola sahifasining oxirgi bo‘limi "Iqtiboslar": maqola ustuni, turi va ranglarida — o‘rtacha baho sarlavha qatorida,
 * iqtiboslar oddiy ro‘yxat, ostida baho berish formasi. <article>’dan tashqarida: Scholar uchun maqola matni emas.
 * Ro‘yxat statik HTML’da (qidiruv tizimlari ham ko‘radi), forma esa klientda sessiyani o‘zi tekshiradi.
 */
export function RatingSection({ articleId, ratings, lang = "uz" }: { articleId: number; ratings: ArticleRatings; lang?: Lang }) {
  const T = ratingText[lang];
  const { count, avg, items } = ratings;
  const avgText = formatAverage(avg, lang);
  const rest = items.slice(VISIBLE);

  return (
    <section
      id="iqtiboslar"
      aria-labelledby="iqtiboslar-title"
      className="mx-auto mt-12 max-w-3xl scroll-mt-6 break-words border-t border-line pt-8"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id="iqtiboslar-title" className="font-serif text-lg font-semibold">
          {T.section.title}
        </h2>
        {count > 0 ? (
          <p className="flex items-center gap-2 text-sm">
            {/* Ekran o‘quvchi qiymatni yulduzlar label’idan oladi ("5 dan 4,3") — raqam ikki marta o‘qilmasin */}
            <span aria-hidden="true" className="font-semibold tabular-nums">
              {avgText}
            </span>
            <Stars value={avg} label={T.section.average(avgText)} className="text-base" />
            <span className="text-muted">{T.section.count(count)}</span>
          </p>
        ) : (
          <p className="text-sm text-muted">{T.section.empty}</p>
        )}
      </div>

      {count > 0 && <Reviews items={items.slice(0, VISIBLE)} lang={lang} />}
      {rest.length > 0 && (
        <details className="group">
          <summary className="btn btn-secondary mt-1 list-none [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{T.section.more(rest.length)}</span>
            <span className="hidden group-open:inline">{T.section.less}</span>
          </summary>
          <Reviews items={rest} lang={lang} />
        </details>
      )}

      {/* Forma oynada (maqola tepasidagi «Iqtibos keltirish» ham shuni ochadi): kirmagan yoki muallif bo‘lsa — ogohlantirish */}
      <button type="button" popoverTarget={RATING_DIALOG_ID} className={`btn btn-primary ${count > 0 ? "mt-6" : "mt-4"}`}>
        {T.section.write}
      </button>
      <RatingDialog articleId={articleId} lang={lang} />
    </section>
  );
}

function Reviews({ items, lang }: { items: RatingItem[]; lang: Lang }) {
  const T = ratingText[lang];
  return (
    <ol className="mt-2 divide-y divide-line">
      {items.map((r) => (
        <li key={r.id} className="py-5">
          <figure>
            <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold">
                {r.slug ? (
                  <Link href={localePath(lang, `/oqituvchi/${r.slug}`)} className="link">
                    {r.name}
                  </Link>
                ) : (
                  r.name
                )}
              </span>
              <Stars value={r.stars} label={T.form.star(r.stars)} />
              <time dateTime={new Date(r.date).toISOString()} className="text-muted">
                {formatDate(r.date, lang)}
              </time>
            </figcaption>
            <blockquote className="mt-2 max-w-[65ch] whitespace-pre-line leading-relaxed">{r.body}</blockquote>
          </figure>
        </li>
      ))}
    </ol>
  );
}
