import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArticleList } from "@/components/article/article-list";
import { listPublishedArticles } from "@/server/articles/public";
import { HomeSection } from "./home-section";

/** So‘nggi 6 ta maqola. Maqola bo‘lmasa bo‘lim chizilmaydi */
export function HomeArticles() {
  return (
    <Suspense fallback={null}>
      <Articles />
    </Suspense>
  );
}

async function Articles() {
  // Build bazaga murojaat qilmasin: bo‘lim so‘rov vaqtida keshdan chiziladi, sahifaning qolgani statik
  await connection();
  const items = await listPublishedArticles(6);
  if (items.length === 0) return null;

  return (
    <HomeSection
      id="latest-title"
      title="So‘nggi maqolalar"
      action={
        <Link href="/maqolalar" className="link">
          Barcha maqolalar
        </Link>
      }
    >
      <ArticleList items={items} />
    </HomeSection>
  );
}
