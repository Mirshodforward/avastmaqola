import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { UNIVERSITY_NAME } from "@/lib/brand";
import { formatDate, truncate } from "@/lib/format";
import { newsImageUrl } from "@/lib/media";
import { listPublishedNews } from "@/server/news/service";

export const metadata: Metadata = {
  title: "Yangiliklar",
  description: `${UNIVERSITY_NAME} ilmiy maqolalar portali yangiliklari va e’lonlari.`,
  alternates: { canonical: "/yangiliklar" },
};

export default function NewsPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Yangiliklar</h1>
        <Suspense fallback={<ListSkeleton />}>
          <NewsList />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}

async function NewsList() {
  // Ro‘yxat so‘rov vaqtida keshdan olinadi: build bazaga murojaat qilmaydi
  await connection();
  const items = await listPublishedNews();
  if (items.length === 0) return <p className="mt-8 text-muted">Hali yangiliklar yo‘q.</p>;

  return (
    <ul className="mt-8 space-y-5">
      {items.map((n) => {
        const date = new Date(n.publishedAt!); // chop etilganda sana doim bor (ro‘yxat shart bilan olinadi)
        return (
          <li key={n.id}>
            <article
              className={`grid gap-5 rounded-xl border border-line bg-paper p-5 sm:p-6 ${n.imageKey ? "sm:grid-cols-[13rem_minmax(0,1fr)]" : ""}`}
            >
              {n.imageKey && (
                <Image
                  src={newsImageUrl(n.imageKey)}
                  alt=""
                  width={1200}
                  height={675}
                  unoptimized
                  className="aspect-video w-full rounded-lg bg-mist object-cover"
                />
              )}
              <div className="min-w-0">
                <time dateTime={date.toISOString()} className="text-sm text-muted">
                  {formatDate(date)}
                </time>
                <h2 className="mt-1 font-serif text-xl font-semibold leading-snug">
                  <Link href={`/yangiliklar/${n.id}`} className="hover:text-lapis">
                    {n.title}
                  </Link>
                </h2>
                <p className="mt-2 leading-relaxed text-muted">{truncate(n.excerpt.replace(/\s+/g, " "), 220)}</p>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <ul aria-label="Yuklanmoqda" className="mt-8 animate-pulse space-y-5 motion-reduce:animate-none">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-36 rounded-xl border border-line bg-paper" />
      ))}
    </ul>
  );
}
