import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { langAlternates, localePath } from "@/i18n/lang";
import { newsPageText } from "@/i18n/page-yangiliklar";
import { pageLang } from "@/i18n/server";
import { UNIVERSITY_NAME } from "@/lib/brand";
import { formatDate, truncate } from "@/lib/format";
import type { Lang } from "@/lib/langs";
import { newsImageUrl } from "@/lib/media";
import { listPublishedNews } from "@/server/news/service";

type Props = PageProps<"/[lang]/yangiliklar">;

// generateMetadata va sahifa til params’ini o‘qiydi — instant tekshiruvi o‘chiq (bosh sahifadagi kabi)
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const t = newsPageText[lang];
  return { title: t.title, description: t.description(UNIVERSITY_NAME), alternates: langAlternates(lang, "/yangiliklar") };
}

export default async function NewsPage({ params }: Props) {
  const lang = await pageLang(params);
  const t = newsPageText[lang];
  return (
    <>
      <PublicHeader />
      <main className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.title}</h1>
        <Suspense fallback={<ListSkeleton label={t.loading} />}>
          <NewsList lang={lang} />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}

async function NewsList({ lang }: { lang: Lang }) {
  // Ro‘yxat so‘rov vaqtida keshdan olinadi: build bazaga murojaat qilmaydi
  await connection();
  const items = await listPublishedNews();
  if (items.length === 0) return <p className="mt-8 text-muted">{newsPageText[lang].empty}</p>;

  // Bosh sahifadagi yangiliklar bilan bir xil qatorlar: chiziq bilan ajratilgan, butun qator bosiladi (after).
  // Sarlavha va parcha — admin o‘zbekcha yozgan matn (lang="uz"), sana — sahifa tilida
  return (
    <ul role="list" className="mt-8 divide-y divide-line border-y border-line">
      {items.map((n) => {
        const date = new Date(n.publishedAt!); // chop etilganda sana doim bor (ro‘yxat shart bilan olinadi)
        return (
          <li key={n.id} className={`relative grid gap-x-6 gap-y-3 py-5 ${n.imageKey ? "sm:grid-cols-[10rem_minmax(0,1fr)]" : ""}`}>
            {n.imageKey && (
              <Image
                src={newsImageUrl(n.imageKey)}
                alt=""
                width={1200}
                height={675}
                unoptimized
                className="aspect-video w-full rounded-md bg-mist object-cover"
              />
            )}
            <div className="min-w-0">
              <time dateTime={date.toISOString()} className="text-sm text-muted">
                {formatDate(date, lang)}
              </time>
              <h2 lang="uz" className="mt-1 font-serif text-lg leading-snug font-semibold">
                <Link href={localePath(lang, `/yangiliklar/${n.id}`)} className="after:absolute after:inset-0 hover:text-lapis">
                  {n.title}
                </Link>
              </h2>
              <p lang="uz" className="mt-1 max-w-[34em] text-sm leading-relaxed text-muted">
                {truncate(n.excerpt.replace(/\s+/g, " "), 160)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ListSkeleton({ label }: { label: string }) {
  return (
    <ul aria-label={label} className="mt-8 animate-pulse divide-y divide-line border-y border-line motion-reduce:animate-none">
      {[0, 1, 2].map((i) => (
        <li key={i} className="py-5">
          <div className="h-4 w-28 rounded bg-line" />
          <div className="mt-2 h-6 w-3/4 rounded bg-line" />
          <div className="mt-2 h-4 w-1/2 rounded bg-line" />
        </li>
      ))}
    </ul>
  );
}
