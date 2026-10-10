import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { formatDate } from "@/lib/format";
import { listPublishedArticles } from "@/server/articles/public";
import { HomeSection } from "./home-section";

/**
 * So‘nggi 6 ta maqola — jurnal mundarijasi ko‘rinishida: chapda sondagi joyi ("3-son", "12-maqola"),
 * o‘rtada sarlavha va mualliflar, o‘ngda sana. Maqola bo‘lmasa bo‘lim chizilmaydi.
 */
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
      <ol className="divide-y divide-line border-y border-line">
        {items.map((a) => (
          // Havola faqat sarlavhada (ekran o‘quvchi uchun aniq nom), bosiladigan joy esa butun qator (after)
          <li key={a.id} className="relative grid gap-x-8 gap-y-2 py-5 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
            <p className="text-sm leading-tight text-muted tabular-nums">
              <span className="block">{a.issueNo}-son</span>
              {a.issueSeq && <span className="mt-1 block font-serif text-lg font-semibold text-ink">{a.issueSeq}-maqola</span>}
            </p>
            <div className="min-w-0 break-words">
              <h3 className="font-serif text-lg leading-snug font-semibold">
                <Link href={`/maqola/${a.id}`} className="after:absolute after:inset-0 hover:text-lapis">
                  {a.title}
                </Link>
              </h3>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{a.byline}</p>
            </div>
            {a.publishedAt && (
              <time dateTime={new Date(a.publishedAt).toISOString()} className="text-sm whitespace-nowrap text-muted sm:text-right">
                {formatDate(a.publishedAt)}
              </time>
            )}
          </li>
        ))}
      </ol>
    </HomeSection>
  );
}
