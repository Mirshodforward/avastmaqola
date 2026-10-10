import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArticleList, type ArticleListEntry } from "@/components/article/article-list";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { langAlternates } from "@/i18n/lang";
import { articlesPageText } from "@/i18n/page-maqolalar";
import { pageLang } from "@/i18n/server";
import { UNIVERSITY_NAME } from "@/lib/brand";
import { yearOf } from "@/lib/format";
import type { Lang } from "@/lib/langs";
import { listPublishedArticles } from "@/server/articles/public";

type Props = PageProps<"/[lang]/maqolalar">;

// Til (params) Suspense’dan tashqarida o‘qiladi ([lang]/layout.tsx’da ham): o‘tish tayyor statik javobni kutadi
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const t = articlesPageText[lang].page;
  return {
    title: t.title,
    description: t.description(UNIVERSITY_NAME),
    alternates: langAlternates(lang, "/maqolalar"),
  };
}

/** Google Scholar talab qiladigan "browse" sahifa: har bir maqolaga oddiy havola orqali yetib borish mumkin */
export default async function ArticlesPage({ params }: Props) {
  const lang = await pageLang(params);
  const t = articlesPageText[lang].page;
  return (
    <>
      <PublicHeader />
      <main className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.title}</h1>
        <Suspense fallback={<ListSkeleton label={t.loading} />}>
          <ArticlesByYear lang={lang} />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}

async function ArticlesByYear({ lang }: { lang: Lang }) {
  // Ro‘yxat so‘rov vaqtida keshdan olinadi: build bazaga murojaat qilmaydi
  await connection();
  const items = await listPublishedArticles();
  if (items.length === 0) return <p className="mt-8 text-muted">{articlesPageText[lang].page.empty}</p>;

  const years = new Map<number, ArticleListEntry[]>();
  for (const item of items) {
    const year = yearOf(item.publishedAt!); // chop etilgan maqolada sana doim bor (DB CHECK)
    years.set(year, [...(years.get(year) ?? []), item]);
  }
  return (
    <>
      {[...years].map(([year, list], i) => (
        <section key={year} aria-labelledby={`yil-${year}`} className={i === 0 ? "mt-8" : "mt-12 border-t border-line pt-8"}>
          <h2 id={`yil-${year}`} className="font-serif text-2xl font-semibold tracking-tight tabular-nums">
            {year}
          </h2>
          <div className="mt-4">
            <ArticleList items={list} lang={lang} />
          </div>
        </section>
      ))}
    </>
  );
}

function ListSkeleton({ label }: { label: string }) {
  return (
    <ul aria-label={label} className="mt-20 grid animate-pulse gap-4 motion-reduce:animate-none lg:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="h-36 rounded-xl border border-line bg-paper" />
      ))}
    </ul>
  );
}
