import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { homeText } from "@/i18n/home";
import { localePath } from "@/i18n/lang";
import { formatDate, truncate } from "@/lib/format";
import type { Lang } from "@/lib/langs";
import { newsImageUrl } from "@/lib/media";
import { listPublishedNews } from "@/server/news/service";
import { HomeSection } from "./home-section";
import { seq } from "./motion";

/** So‘nggi 3 ta yangilik. Yangilik bo‘lmasa bo‘lim chizilmaydi. Yangilik matnining o‘zi o‘zbekcha (admin yozadi) */
export function HomeNews({ lang }: { lang: Lang }) {
  return (
    <Suspense fallback={null}>
      <News lang={lang} />
    </Suspense>
  );
}

async function News({ lang }: { lang: Lang }) {
  await connection();
  const items = (await listPublishedNews()).slice(0, 3);
  if (items.length === 0) return null;
  const t = homeText[lang].news;

  return (
    <HomeSection
      id="news-title"
      title={t.title}
      tone="paper"
      action={
        <Link href={localePath(lang, "/yangiliklar")} className="link">
          {t.all}
        </Link>
      }
    >
      <ul className="divide-y divide-line border-y border-line">
        {items.map((n, i) => {
          const date = new Date(n.publishedAt!); // ro‘yxat faqat chop etilganlardan
          return (
            <li
              key={n.id}
              style={seq(i % 2)}
              className={`m-rise relative grid gap-x-6 gap-y-3 py-5 ${n.imageKey ? "sm:grid-cols-[10rem_minmax(0,1fr)]" : ""}`}
            >
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
                <h3 lang="uz" className="mt-1 font-serif text-lg leading-snug font-semibold">
                  <Link href={localePath(lang, `/yangiliklar/${n.id}`)} className="after:absolute after:inset-0 hover:text-lapis">
                    {n.title}
                  </Link>
                </h3>
                <p lang="uz" className="mt-1 text-sm leading-relaxed text-muted">
                  {truncate(n.excerpt.replace(/\s+/g, " "), 160)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </HomeSection>
  );
}
