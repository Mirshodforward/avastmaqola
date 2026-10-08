import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { listPublishedArticles } from "@/server/articles/public";
import { ArticleList } from "./article-list";

/** Bosh sahifadagi "So‘nggi maqolalar". Maqola bo‘lmasa hech narsa chizmaydi. */
export function LatestArticles() {
  return (
    <Suspense fallback={null}>
      <Latest />
    </Suspense>
  );
}

async function Latest() {
  // Build bazaga murojaat qilmasin: bo‘lim so‘rov vaqtida keshdan chiziladi, sahifaning qolgani statik
  await connection();
  const items = await listPublishedArticles(6);
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="latest-title"
      className="mx-auto grid w-[90%] gap-6 py-14 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12"
    >
      <h2 id="latest-title" className="font-serif text-2xl font-semibold tracking-tight">
        So‘nggi maqolalar
      </h2>
      <div>
        <ArticleList items={items} />
        <Link href="/maqolalar" className="link mt-6 inline-block">
          Barcha maqolalar
        </Link>
      </div>
    </section>
  );
}
