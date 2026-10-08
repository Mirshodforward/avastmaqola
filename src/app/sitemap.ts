import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { sitemapEntries } from "@/server/articles/public";
import { siteUrl } from "@/server/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // So‘rov vaqtida hosil qilinadi: build bazaga murojaat qilmaydi, yangi maqolalar darhol kiradi
  await connection();
  const url = siteUrl();
  const { published, teachers } = await sitemapEntries();
  return [
    { url: `${url}/` },
    { url: `${url}/maqolalar` },
    ...published.map((a) => ({ url: `${url}/maqola/${a.id}`, lastModified: a.updatedAt })),
    ...teachers.map((t) => ({ url: `${url}/oqituvchi/${t.slug}`, lastModified: t.updatedAt })),
  ];
}
