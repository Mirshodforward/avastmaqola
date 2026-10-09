import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { sitemapEntries } from "@/server/articles/public";
import { publishedNewsEntries } from "@/server/news/service";
import { siteUrl } from "@/server/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // So‘rov vaqtida hosil qilinadi: build bazaga murojaat qilmaydi, yangi maqolalar darhol kiradi
  await connection();
  const url = siteUrl();
  const [{ published, teachers }, news] = await Promise.all([sitemapEntries(), publishedNewsEntries()]);
  return [
    { url: `${url}/` },
    { url: `${url}/maqolalar` },
    { url: `${url}/mualliflar` },
    { url: `${url}/yonalishlar` },
    { url: `${url}/yangiliklar` },
    { url: `${url}/haqida` },
    ...published.map((a) => ({ url: `${url}/maqola/${a.id}`, lastModified: a.updatedAt })),
    ...news.map((n) => ({ url: `${url}/yangiliklar/${n.id}`, lastModified: n.updatedAt })),
    ...teachers.map((t) => ({ url: `${url}/oqituvchi/${t.slug}`, lastModified: t.updatedAt })),
  ];
}
