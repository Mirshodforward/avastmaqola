import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/article/article-view";
import { PublicHeader } from "@/components/public-header";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_NAME } from "@/lib/brand";
import { truncate } from "@/lib/format";
import { avatarUrl } from "@/lib/media";
import { PLACEHOLDER_ARTICLE_ID, getPublishedArticle } from "@/server/articles/public";
import { parseArticleId } from "@/server/articles/schemas";
import { articleJsonLd, articleUrl, citationMeta } from "@/server/articles/seo";

type Props = PageProps<"/maqola/[id]">;

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
  const v = await load(params);
  if (!v) return { title: "Maqola topilmadi", robots: { index: false } };

  const title = v.titles[v.lang];
  const description = truncate(v.abstracts[v.lang].replace(/\s+/g, " "), 160);
  const url = `/maqola/${v.id}`;
  return {
    title,
    description,
    keywords: v.keywords[v.lang],
    authors: v.authors.map((a) => ({ name: `${a.givenName} ${a.familyName}` })),
    alternates: { canonical: url },
    // Sahifadagi openGraph layout’dagini butunlay almashtiradi (birlashtirmaydi) — sayt nomi va til qayta yoziladi
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "uz_UZ",
      url,
      title,
      description,
      publishedTime: v.publishedAt ? new Date(v.publishedAt).toISOString() : undefined,
      modifiedTime: new Date(v.updatedAt).toISOString(),
      tags: v.keywords[v.lang],
      images: v.owner.photoKey ? [{ url: avatarUrl(v.owner.photoKey, 512), width: 512, height: 512, alt: v.owner.name }] : undefined,
    },
    // Google Scholar shu teglardan sarlavha, mualliflar, sana va PDF’ni oladi
    other: citationMeta(v),
  };
}

export default async function ArticlePage({ params }: Props) {
  const v = await load(params);
  if (!v) notFound();

  return (
    <>
      <PublicHeader />
      <main className="w-full flex-1 px-4 py-10 sm:px-6">
        <ArticleView v={v} absoluteUrl={articleUrl(v.id)} />
        <JsonLd data={articleJsonLd(v)} />
      </main>
    </>
  );
}
