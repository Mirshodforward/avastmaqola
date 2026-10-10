import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { JsonLd } from "@/components/seo/json-ld";
import { localePath } from "@/i18n/lang";
import { newsPageText } from "@/i18n/page-yangiliklar";
import { pageLang } from "@/i18n/server";
import { SITE_NAME, UNIVERSITY_NAME } from "@/lib/brand";
import { formatDate, truncate } from "@/lib/format";
import { newsImageUrl } from "@/lib/media";
import { parseNewsId } from "@/server/news/schemas";
import { PLACEHOLDER_NEWS_ID, getPublishedNews } from "@/server/news/service";
import { siteUrl } from "@/server/site";

type Props = PageProps<"/[lang]/yangiliklar/[id]">;

// Maqola sahifasidagidek to‘liq statik: birinchi so‘rov ham tayyor HTML, yo‘q yoki qoralama yangilik — haqiqiy 404
export const ensureStatic = "navigation";
export const instant = false;

export async function generateStaticParams() {
  return [{ id: PLACEHOLDER_NEWS_ID }];
}

async function load(params: Props["params"]) {
  const id = parseNewsId((await params).id);
  return id ? getPublishedNews(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [lang, n] = await Promise.all([pageLang(params), load(params)]);
  if (!n) return { title: newsPageText[lang].notFound, robots: { index: false } };

  // Sarlavha va tavsif — yangilikning o‘zi (admin o‘zbekcha yozadi), har bir tilda bir xil. Matn tarjima qilinmagani
  // uchun ruscha/inglizcha nusxa alohida sahifa emas: canonical o‘zbekchasiga (qidiruvda dublikat bo‘lmasin), hreflang yo‘q
  const description = truncate(n.body.replace(/\s+/g, " "), 160);
  const alternates = { canonical: `/yangiliklar/${n.id}` };
  return {
    title: n.title,
    description,
    alternates,
    // Sahifadagi openGraph layout’dagini butunlay almashtiradi — sayt nomi va til qayta yoziladi
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      // Matn o‘zbekcha, og:url ham o‘zbekcha sahifa
      locale: "uz_UZ",
      url: alternates.canonical,
      title: n.title,
      description,
      publishedTime: new Date(n.publishedAt!).toISOString(),
      modifiedTime: new Date(n.updatedAt).toISOString(),
      images: n.imageKey ? [{ url: newsImageUrl(n.imageKey), width: 1200, height: 675, alt: n.title }] : undefined,
    },
  };
}

export default async function NewsItemPage({ params }: Props) {
  const [lang, n] = await Promise.all([pageLang(params), load(params)]);
  if (!n) notFound();
  const t = newsPageText[lang];
  const published = new Date(n.publishedAt!);
  const url = `${siteUrl()}/yangiliklar/${n.id}`;

  return (
    <>
      <PublicHeader />
      <main className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
        {/* Bo‘lim havolasi (o‘qituvchi profilidagi bilan bir xil); py-1 — bosish maydoni kamida 24px */}
        <nav aria-label={t.breadcrumb} className="text-sm">
          <Link href={localePath(lang, "/yangiliklar")} className="link inline-block py-1">
            {t.title}
          </Link>
        </nav>
        {/* Chap cheti header bilan bir chiziqda; matn qatori o‘qish uchun qulay enda (~75 belgi).
            Sarlavha va matn — admin o‘zbekcha yozgan yangilik (lang="uz"), sana — sahifa tilida */}
        <article aria-labelledby="news-title" className="mt-4 max-w-3xl">
          <h1 id="news-title" lang="uz" className="font-serif text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            {n.title}
          </h1>
          <time dateTime={published.toISOString()} className="mt-3 block text-muted">
            {formatDate(published, lang)}
          </time>
          {n.imageKey && (
            <Image
              src={newsImageUrl(n.imageKey)}
              alt=""
              width={1200}
              height={675}
              unoptimized
              preload
              className="mt-6 aspect-video w-full rounded-xl bg-mist object-cover"
            />
          )}
          {/* Xatboshilar bo‘sh qator bilan ajratiladi, oddiy qator tashlash saqlanadi */}
          <div lang="uz" className="mt-6 max-w-[34em] space-y-4 text-lg leading-relaxed">
            {n.body.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: n.title,
            datePublished: published.toISOString(),
            dateModified: new Date(n.updatedAt).toISOString(),
            mainEntityOfPage: url,
            ...(n.imageKey ? { image: [`${siteUrl()}${newsImageUrl(n.imageKey)}`] } : {}),
            // To‘liq yoziladi: #university ta’rifi faqat bosh sahifada, Google @id’ni sahifalar orasida kuzatmaydi
            publisher: { "@type": "CollegeOrUniversity", "@id": `${siteUrl()}/#university`, name: UNIVERSITY_NAME },
          }}
        />
      </main>
      <PublicFooter />
    </>
  );
}
