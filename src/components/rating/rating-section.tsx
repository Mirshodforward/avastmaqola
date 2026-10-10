import Link from "next/link";
import { Avatar } from "@/components/profile/avatar";
import { localePath } from "@/i18n/lang";
import { formatDate } from "@/lib/format";
import type { Lang } from "@/lib/langs";
import type { ArticleRatings, RatingItem } from "@/server/ratings/service";
import { RATING_DIALOG_ID, RatingDialog } from "./rating-dialog";
import { StarShape, Stars } from "./stars";
import { formatAverage, ratingText } from "./text";

/** Ochiq turadigan iqtiboslar soni; qolganlari "Yana N ta" ostida — baribir statik HTML’da, har biri bir marta */
const VISIBLE = 3;

/**
 * Maqola sahifasining oxirgi bo‘limi "Iqtiboslar": maqola ustuni, turi va ranglarida. Tepada sarlavha va asosiy amal
 * («Iqtibos keltirish»), keyin umumiy reyting (o‘rtacha va taqsimot), so‘ng iqtiboslar chiziqli ro‘yxatda.
 * <article>’dan tashqarida: Scholar uchun maqola matni emas. Ro‘yxat statik HTML’da (qidiruv tizimlari ham ko‘radi),
 * forma esa oynada, klientda sessiyani o‘zi tekshiradi.
 */
export function RatingSection({ articleId, ratings, lang = "uz" }: { articleId: number; ratings: ArticleRatings; lang?: Lang }) {
  const T = ratingText[lang];
  const { count, avg, dist, items } = ratings;
  const rest = items.slice(VISIBLE);

  return (
    <section
      id="iqtiboslar"
      aria-labelledby="iqtiboslar-title"
      className="mx-auto mt-12 max-w-3xl scroll-mt-6 break-words border-t border-line pt-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id="iqtiboslar-title" className="font-serif text-lg font-semibold">
          {T.section.title}
        </h2>
        {/* Forma oynada (maqola tepasidagi «Iqtibos keltirish» ham shuni ochadi): kirmagan yoki muallif bo‘lsa — ogohlantirish */}
        <button type="button" popoverTarget={RATING_DIALOG_ID} className="btn btn-primary">
          {T.section.write}
        </button>
      </div>

      {count > 0 ? (
        <>
          <Summary avg={avg} count={count} dist={dist} lang={lang} />
          <Reviews items={items.slice(0, VISIBLE)} lang={lang} />
          {rest.length > 0 && (
            <details className="group">
              <summary className="btn btn-secondary list-none [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">{T.section.more(rest.length)}</span>
                <span className="hidden group-open:inline">{T.section.less}</span>
              </summary>
              <Reviews items={rest} lang={lang} />
            </details>
          )}
        </>
      ) : (
        <p className="mt-4 text-muted">{T.section.empty}</p>
      )}

      <RatingDialog articleId={articleId} lang={lang} />
    </section>
  );
}

/**
 * Umumiy reyting: chapda o‘rtacha baho (maqola kartasidagi raqamli yon panel kabi: mist fon, lapis Literata raqam),
 * o‘ngda 5 → 1 taqsimot. Chiziqlar — faqat ko‘rinish; ekran o‘quvchi har qatorni matn bilan o‘qiydi.
 */
function Summary({ avg, count, dist, lang }: { avg: number; count: number; dist: number[]; lang: Lang }) {
  const T = ratingText[lang];
  const avgText = formatAverage(avg, lang);
  return (
    <div className="mt-5 grid overflow-hidden rounded-xl border border-line bg-paper sm:grid-cols-[11rem_minmax(0,1fr)]">
      <div className="flex items-center gap-x-5 gap-y-2 bg-mist p-4 sm:flex-col sm:items-start sm:justify-center sm:p-5">
        {/* Qiymatni ekran o‘quvchi yulduzlar label’idan oladi ("5 dan 4,3") — raqam ikki marta o‘qilmasin */}
        <p aria-hidden="true" className="font-serif text-4xl leading-none font-semibold text-lapis tabular-nums">
          {avgText}
        </p>
        <div>
          <Stars value={avg} label={T.section.average(avgText)} className="text-lg" />
          <p className="mt-1 text-sm text-muted">{T.section.count(count)}</p>
        </div>
      </div>
      <ul aria-label={T.section.distribution} className="grid content-center gap-2 p-4 sm:p-5">
        {[5, 4, 3, 2, 1].map((star) => (
          <li key={star} className="grid grid-cols-[2.25rem_minmax(0,1fr)_1.75rem] items-center gap-3 text-sm">
            <span aria-hidden="true" className="flex items-center justify-end gap-1 tabular-nums">
              {star}
              <StarShape className="size-3 text-lapis" />
            </span>
            <span aria-hidden="true" className="h-2 bg-mist">
              <span className="block h-full bg-lapis" style={{ width: `${(dist[star - 1] / count) * 100}%` }} />
            </span>
            <span aria-hidden="true" className="text-right text-muted tabular-nums">
              {dist[star - 1]}
            </span>
            <span className="sr-only">{T.section.distributionRow(star, dist[star - 1])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Reviews({ items, lang }: { items: RatingItem[]; lang: Lang }) {
  const T = ratingText[lang];
  return (
    <ol className="mt-2 divide-y divide-line">
      {items.map((r) => (
        <li key={r.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 py-6">
          <Avatar src={r.photoUrl} name={r.name} size={40} />
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
              <p className="font-medium">
                {r.slug ? (
                  <Link href={localePath(lang, `/oqituvchi/${r.slug}`)} className="hover:text-lapis">
                    {r.name}
                  </Link>
                ) : (
                  r.name
                )}
              </p>
              <time dateTime={new Date(r.date).toISOString()} className="text-sm text-muted">
                {formatDate(r.date, lang)}
              </time>
            </div>
            <Stars value={r.stars} label={T.form.star(r.stars)} className="mt-1 text-base" />
            <blockquote className="mt-2 max-w-[34em] leading-relaxed whitespace-pre-line">{r.body}</blockquote>
          </div>
        </li>
      ))}
    </ol>
  );
}
