import { connection } from "next/server";
import { Suspense } from "react";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { homeText } from "@/i18n/home";
import { LANGS, type Lang } from "@/lib/langs";
import { listPublishedArticles } from "@/server/articles/public";
import { groupByDirection, listPublicTeachers } from "@/server/profiles/directory";
import { delay } from "./motion";

/** Portal raqamlarda: ufq ostidagi sokin qator (yerda). Chop etilgan maqola bo‘lmasa chizilmaydi */
export function HomeStats({ lang }: { lang: Lang }) {
  return (
    // Balandlik oldindan band: raqamlar oqim bilan kelganda hero siljimaydi
    <Suspense fallback={<div className="h-[12.25rem] lg:h-[7.625rem]" />}>
      <Stats lang={lang} />
    </Suspense>
  );
}

async function Stats({ lang }: { lang: Lang }) {
  // Build bazaga murojaat qilmasin: so‘rov vaqtida keshdan chiziladi, sahifaning qolgani statik
  await connection();
  const [articles, teachers] = await Promise.all([listPublishedArticles(), listPublicTeachers()]);
  if (articles.length === 0) return null;

  const t = homeText[lang].stats;
  const items = [
    { label: t.articles, value: articles.length },
    { label: t.authors, value: teachers.length },
    { label: t.directions, value: groupByDirection(teachers).length },
    { label: t.languages, value: LANGS.length },
  ];
  return (
    <dl className={`grid grid-cols-2 gap-y-6 py-7 lg:grid-cols-4 lg:py-8 ${PUBLIC_WIDTH}`}>
      {items.map((item, i) => (
        // Raqam yuqorida ko‘rinadi, ekran o‘quvchi esa avval nomini o‘qiydi (dt → dd).
        // Ufq chizig‘i chizilib bo‘lgach (~1s) raqamlar birin-ketin paydo bo‘ladi
        <div
          key={item.label}
          style={delay(0.9 + i * 0.1)}
          className="l-in flex flex-col-reverse justify-end lg:border-l lg:border-line lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
        >
          <dt className="mt-0.5 text-sm text-muted">{item.label}</dt>
          <dd className="font-serif text-3xl font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
