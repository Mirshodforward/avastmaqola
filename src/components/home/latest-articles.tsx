import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { homeText } from "@/i18n/home";
import { localePath } from "@/i18n/lang";
import { formatDate } from "@/lib/format";
import type { Lang } from "@/lib/langs";
import { listPublishedArticles } from "@/server/articles/public";
import { HomeSection } from "./home-section";
import { seq } from "./motion";

/**
 * So‘nggi 6 ta maqola — gorizontal (yotiq) kartochkalar, kompyuterda ikki ustunli to‘r.
 * Karta: chapda jurnal "muqovasi" (sondagi joyi: "3-son", "12-maqola"), o‘ngda sana, sarlavha va mualliflar.
 * Maqola bo‘lmasa bo‘lim chizilmaydi.
 */
export function HomeArticles({ lang }: { lang: Lang }) {
  return (
    <Suspense fallback={null}>
      <Articles lang={lang} />
    </Suspense>
  );
}

async function Articles({ lang }: { lang: Lang }) {
  // Build bazaga murojaat qilmasin: bo‘lim so‘rov vaqtida keshdan chiziladi, sahifaning qolgani statik
  await connection();
  const items = await listPublishedArticles(6);
  if (items.length === 0) return null;
  const t = homeText[lang].articles;

  return (
    <HomeSection
      id="latest-title"
      title={t.title}
      stacked
      action={
        <Link href={localePath(lang, "/maqolalar")} className="link">
          {t.all}
        </Link>
      }
    >
      <ol role="list" className="grid gap-4 lg:grid-cols-2">
        {items.map((a, i) => (
          // Havola faqat sarlavhada (ekran o‘quvchi uchun aniq nom), bosiladigan joy esa butun karta (after).
          // Fokus halqasi butun karta atrofida: has-[a:focus-visible].
          // Harakat: karta o‘z o‘rniga kirganda ko‘tariladi (qatordagi ikkinchisi biroz kechikib), muqova yoylari chiziladi
          <li
            key={a.id}
            style={seq(i % 2)}
            className="m-rise vt-grp group relative flex overflow-hidden rounded-xl border border-line bg-paper transition-colors hover:border-lapis/50 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-tile"
          >
            {/* Muqova: ketma-ket sonning o‘zi (bezak emas, bazadagi joy). Konsentrik yoylar — portal ufqi motivi */}
            <div className="relative flex w-28 shrink-0 flex-col justify-between overflow-hidden border-r border-line bg-mist p-3 sm:w-32 sm:p-4">
              <svg
                aria-hidden="true"
                viewBox="0 0 112 160"
                preserveAspectRatio="xMaxYMax slice"
                className="pointer-events-none absolute inset-0 size-full text-lapis opacity-[0.12]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                {[34, 60, 86, 112, 138].map((r, k) => (
                  <circle key={r} cx="112" cy="160" r={r} pathLength={1} className="m-stroke tl-grp" style={seq(k)} />
                ))}
              </svg>
              {/* whitespace-nowrap: "6-maqola" defisdan keyin ikki qatorga bo‘linib qolmasin */}
              <p className="relative text-xs whitespace-nowrap text-muted tabular-nums">{t.issue(a.issueNo)}</p>
              {a.issueSeq && (
                <p className="relative font-serif text-sm leading-tight font-semibold whitespace-nowrap text-lapis tabular-nums sm:text-base">
                  {t.seq(a.issueSeq)}
                </p>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
              {a.publishedAt && (
                <time dateTime={new Date(a.publishedAt).toISOString()} className="text-sm text-muted">
                  {formatDate(a.publishedAt, lang)}
                </time>
              )}
              {/* Sarlavha sahifa tilida (maqola sahifasidagi kabi), tarjimasi bo‘lmasa asl tilida */}
              <h3
                lang={a.titles[lang] ? lang : a.lang}
                className="mt-1 line-clamp-3 font-serif text-lg leading-snug font-semibold break-words"
              >
                <Link href={localePath(lang, `/maqola/${a.id}`)} className="group-hover:text-lapis after:absolute after:inset-0 focus-visible:outline-none!">
                  {a.titles[lang] || a.title}
                </Link>
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{a.byline}</p>
            </div>
          </li>
        ))}
      </ol>
    </HomeSection>
  );
}
