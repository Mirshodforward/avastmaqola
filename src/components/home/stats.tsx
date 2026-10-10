import { connection } from "next/server";
import { Suspense } from "react";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { listPublishedArticles } from "@/server/articles/public";
import { groupByDirection, listPublicTeachers } from "@/server/profiles/directory";

/** Portal raqamlarda: ufq ostidagi sokin qator (yerda). Chop etilgan maqola bo‘lmasa chizilmaydi */
export function HomeStats() {
  return (
    // Balandlik oldindan band: raqamlar oqim bilan kelganda hero siljimaydi
    <Suspense fallback={<div className="h-[12.25rem] lg:h-[7.25rem]" />}>
      <Stats />
    </Suspense>
  );
}

async function Stats() {
  // Build bazaga murojaat qilmasin: so‘rov vaqtida keshdan chiziladi, sahifaning qolgani statik
  await connection();
  const [articles, teachers] = await Promise.all([listPublishedArticles(), listPublicTeachers()]);
  if (articles.length === 0) return null;

  const items = [
    { label: "Maqolalar", value: articles.length },
    { label: "Mualliflar", value: teachers.length },
    { label: "Ilmiy yo‘nalishlar", value: groupByDirection(teachers).length },
    { label: "Til: o‘zbek, rus, ingliz", value: 3 },
  ];
  return (
    <dl className={`grid grid-cols-2 gap-y-6 py-7 lg:grid-cols-4 lg:py-8 ${PUBLIC_WIDTH}`}>
      {items.map((item) => (
        // Raqam yuqorida ko‘rinadi, ekran o‘quvchi esa avval nomini o‘qiydi (dt → dd)
        <div key={item.label} className="flex flex-col-reverse justify-end lg:border-l lg:border-line lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
          <dt className="mt-0.5 text-sm text-muted">{item.label}</dt>
          <dd className="font-serif text-3xl font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
