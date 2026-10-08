import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArticleList, type ArticleListEntry } from "@/components/article/article-list";
import { PublicHeader } from "@/components/public-header";
import { UNIVERSITY_NAME } from "@/lib/brand";
import { yearOf } from "@/lib/format";
import { listPublishedArticles } from "@/server/articles/public";

export const metadata: Metadata = {
  title: "Maqolalar",
  description: `${UNIVERSITY_NAME} o‘qituvchilarining universitet tasdiqlagan ilmiy maqolalari: yillar bo‘yicha to‘liq ro‘yxat.`,
  alternates: { canonical: "/maqolalar" },
};

/** Google Scholar talab qiladigan "browse" sahifa: har bir maqolaga oddiy havola orqali yetib borish mumkin */
export default function ArticlesPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Maqolalar</h1>
        <p className="mt-2 text-muted">
          {UNIVERSITY_NAME} o‘qituvchilarining universitet tasdiqlagan ilmiy maqolalari. Yangilari birinchi.
        </p>
        <Suspense fallback={<ListSkeleton />}>
          <ArticlesByYear />
        </Suspense>
      </main>
    </>
  );
}

async function ArticlesByYear() {
  // Ro‘yxat so‘rov vaqtida keshdan olinadi: build bazaga murojaat qilmaydi
  await connection();
  const items = await listPublishedArticles();
  if (items.length === 0) return <p className="mt-8 text-muted">Hali chop etilgan maqolalar yo‘q.</p>;

  const years = new Map<number, ArticleListEntry[]>();
  for (const item of items) {
    const year = yearOf(item.publishedAt!); // chop etilgan maqolada sana doim bor (DB CHECK)
    years.set(year, [...(years.get(year) ?? []), item]);
  }
  return (
    <>
      {[...years].map(([year, list]) => (
        <section key={year} aria-labelledby={`yil-${year}`} className="mt-10">
          <h2 id={`yil-${year}`} className="font-serif text-xl font-semibold">
            {year}
          </h2>
          <div className="mt-2">
            <ArticleList items={list} />
          </div>
        </section>
      ))}
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-10 animate-pulse space-y-4 motion-reduce:animate-none" aria-label="Yuklanmoqda">
      <div className="h-6 w-16 rounded bg-line" />
      <div className="h-5 w-full rounded bg-line" />
      <div className="h-4 w-1/2 rounded bg-line" />
      <div className="h-5 w-5/6 rounded bg-line" />
      <div className="h-4 w-1/3 rounded bg-line" />
    </div>
  );
}
