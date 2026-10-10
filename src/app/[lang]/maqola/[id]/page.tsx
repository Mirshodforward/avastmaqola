import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView, shownLang } from "@/components/article/article-view";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { RatingSection } from "@/components/rating/rating-section";
import { JsonLd } from "@/components/seo/json-ld";
import { articleViewText } from "@/i18n/article-view";
import { langAlternates } from "@/i18n/lang";
import { pageLang } from "@/i18n/server";
import { SITE_NAME } from "@/lib/brand";
import { truncate } from "@/lib/format";
import { avatarUrl } from "@/lib/media";
import { PLACEHOLDER_ARTICLE_ID, getPublishedArticle } from "@/server/articles/public";
import { parseArticleId } from "@/server/articles/schemas";
import { articleJsonLd, articleUrl, citationMeta } from "@/server/articles/seo";
import { getArticleRatings } from "@/server/ratings/service";

type Props = PageProps<"/[lang]/maqola/[id]">;

const OG_LOCALE = { uz: "uz_UZ", ru: "ru_RU", en: "en_US" } as const;

// Sahifa to‘liq statik bo‘lishi shart: yangi maqolaga birinchi so‘rov ham (Scholar boti bo‘lsa ham)
// bo‘sh shell emas, tayyor HTML oladi, mavjud bo‘lmagan raqam esa haqiqiy 404 qaytaradi.
// params shuning uchun Suspense’dan tashqarida o‘qiladi — o‘tish tayyor statik javobni kutadi (instant shell emas).
export const ensureStatic = "navigation";
export const instant = false;

export async function generateStaticParams() {
  return [{ id: PLACEHOLDER_ARTICLE_ID }];
}

async function load(params: Props["params"]) {
  const id = parseArticleId((await params).id);
  return id ? getPublishedArticle(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [lang, v] = await Promise.all([pageLang(params), load(params)]);
  if (!v) return { title: articleViewText[lang].notFound, robots: { index: false } };

  // Sarlavha va tavsif sahifa tilida (tarjimasi bo‘lmasa asl tilida). Google Scholar teglari faqat maqolaning asl
  // tilidagi sahifada: Scholar sahifadagi eng katta sarlavha citation_title bilan bir xil bo‘lishini talab qiladi
  const shown = shownLang(v, lang);
  const title = v.titles[shown];
  const description = truncate(v.abstracts[shown].replace(/\s+/g, " "), 160);
  const alternates = langAlternates(lang, `/maqola/${v.id}`);
  return {
    title,
    description,
    keywords: v.keywords[shown],
    authors: v.authors.map((a) => ({ name: `${a.givenName} ${a.familyName}` })),
    alternates,
    // Sahifadagi openGraph layout’dagini butunlay almashtiradi (birlashtirmaydi) — sayt nomi va til qayta yoziladi
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
      url: alternates.canonical,
      title,
      description,
      publishedTime: v.publishedAt ? new Date(v.publishedAt).toISOString() : undefined,
      modifiedTime: new Date(v.updatedAt).toISOString(),
      tags: v.keywords[shown],
      images: v.owner.photoKey ? [{ url: avatarUrl(v.owner.photoKey, 512), width: 512, height: 512, alt: v.owner.name }] : undefined,
    },
    ...(lang === v.lang ? { other: citationMeta(v) } : {}),
  };
}

export default async function ArticlePage({ params }: Props) {
  const [lang, v] = await Promise.all([pageLang(params), load(params)]);
  if (!v) notFound();
  const ratings = await getArticleRatings(v.id);

  return (
    <>
      <PublicHeader />
      <main className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
        <ArticleView v={v} absoluteUrl={articleUrl(v.id)} rating={{ avg: ratings.avg, count: ratings.count }} lang={lang} />
        <RatingSection articleId={v.id} ratings={ratings} lang={lang} />
        {/* Strukturali ma’lumot ham asl tildagi sahifada — sarlavha va annotatsiya shu tilda */}
        {lang === v.lang && <JsonLd data={articleJsonLd(v)} />}
      </main>
      <PublicFooter />
    </>
  );
}
