import { formatDate } from "@/lib/format";
import type { ArticleRatings } from "@/server/ratings/service";
import { RatingDeck, ReviewerName, type DeckItem } from "./rating-deck";
import { RatingForm } from "./rating-form";
import { s } from "./styles";
import { Stars } from "./stars";
import { T, formatAverage } from "./text";

/**
 * Maqola sahifasidagi "Iqtiboslar" bo‘limi: o‘rtacha baho va taqsimot, 3D iqtiboslar to‘plami, baho berish formasi.
 * Ro‘yxat statik HTML’da (qidiruv tizimlari ham ko‘radi), forma esa klientda sessiyani o‘zi tekshiradi.
 */
export function RatingSection({ articleId, ratings }: { articleId: number; ratings: ArticleRatings }) {
  const { count, avg, dist } = ratings;
  const avgText = formatAverage(avg);
  const items: DeckItem[] = ratings.items.map((r) => ({
    id: r.id,
    stars: r.stars,
    body: r.body,
    name: r.name,
    slug: r.slug,
    dateText: formatDate(r.date),
    dateIso: new Date(r.date).toISOString(),
  }));

  return (
    <section
      id="iqtiboslar"
      aria-labelledby="iqtiboslar-title"
      className={`${s.sky} mx-auto mt-16 max-w-5xl scroll-mt-6 px-5 py-8 sm:px-10 sm:py-10`}
    >
      <h2 id="iqtiboslar-title" className={s.title}>
        {T.section.title}
      </h2>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-center gap-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-14">
        <div>
          {count > 0 && (
            <p aria-hidden="true" className={`${s.numeral} mb-4`}>
              {avgText}
            </p>
          )}
          <Stars value={avg} label={count > 0 ? T.section.average(avgText) : undefined} className="text-2xl" />
          <p className={`${s.muted} mt-2 text-sm`}>{count > 0 ? T.section.count(count) : T.section.empty}</p>
        </div>
        {count > 0 && (
          <ul aria-label={T.section.distribution} className="w-full max-w-xl space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <li key={star} className="grid grid-cols-[1rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm">
                <span aria-hidden="true" className="tabular-nums">
                  {star}
                </span>
                <span aria-hidden="true" className={s.track}>
                  <span className={s.bar} style={{ width: `${(dist[star - 1] / count) * 100}%` }} />
                </span>
                <span aria-hidden="true" className={`${s.muted} text-right tabular-nums`}>
                  {dist[star - 1]}
                </span>
                <span className="sr-only">{T.section.distributionRow(star, dist[star - 1])}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* minmax(0,1fr): keng yulduz tanlagich tor ekranda ustunni kengaytirib, matnni kesib qo‘ymasin */}
      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] items-start gap-10 border-t border-white/10 pt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
        {count > 0 ? (
          <RatingDeck items={items} />
        ) : (
          <div className={`${s.panel} flex min-h-56 flex-col justify-center`}>
            <span aria-hidden="true" className={s.quoteMark}>
              «
            </span>
            <p className={`${s.quote} mt-4`}>{T.deck.empty}</p>
          </div>
        )}
        <RatingForm articleId={articleId} />
      </div>

      {count > 0 && (
        <details className={`${s.all} mt-10`}>
          <summary>{T.section.all(count)}</summary>
          <ol className="mt-4 divide-y divide-white/10">
            {items.map((item) => (
              <li key={item.id} className="py-5">
                <figure>
                  <blockquote className={s.quote}>{item.body}</blockquote>
                  <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-semibold">
                      <ReviewerName name={item.name} slug={item.slug} />
                    </span>
                    <Stars value={item.stars} label={T.deck.stars(item.stars)} />
                    <time dateTime={item.dateIso} className={s.muted}>
                      {item.dateText}
                    </time>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
