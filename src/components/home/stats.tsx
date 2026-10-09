import { connection } from "next/server";
import { Suspense } from "react";
import { listPublishedArticles } from "@/server/articles/public";
import { groupByDirection, listPublicTeachers } from "@/server/profiles/directory";
import { PUBLIC_WIDTH } from "@/components/public-width";

/** Portal raqamlarda. Chop etilgan maqola bo‘lmasa chizilmaydi ("0 ta maqola" ko‘rsatilmaydi) */
export function HomeStats() {
  return (
    // Balandlik oldindan band: raqamlar oqim bilan kelganda pastdagi bo‘limlar siljimaydi
    <Suspense fallback={<div className="h-36 border-b border-line bg-paper" />}>
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
    <section aria-label="Portal raqamlarda" className="border-b border-line bg-paper">
      <dl className={`reveal grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4 ${PUBLIC_WIDTH}`}>
        {items.map((item) => (
          // Raqam yuqorida ko‘rinadi, ekran o‘quvchi esa avval nomini o‘qiydi (dt → dd)
          <div key={item.label} className="flex flex-col-reverse">
            <dt className="mt-1 text-sm text-muted">{item.label}</dt>
            <dd className="font-serif text-4xl font-semibold tabular-nums text-lapis sm:text-5xl">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
