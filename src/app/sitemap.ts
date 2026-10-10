import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { localePath } from "@/i18n/lang";
import { LANGS } from "@/lib/langs";
import { sitemapEntries } from "@/server/articles/public";
import { publishedNewsEntries } from "@/server/news/service";
import { siteUrl } from "@/server/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // So‘rov vaqtida hosil qilinadi: build bazaga murojaat qilmaydi, yangi maqolalar darhol kiradi
  await connection();
  const url = siteUrl();
  const [{ published, teachers }, news] = await Promise.all([sitemapEntries(), publishedNewsEntries()]);

  // Har bir ommaviy sahifa uch tilda: o‘zbekchasi prefikssiz, /ru va /en — bir-biriga hreflang bilan bog‘langan
  const languages = (path: string) => Object.fromEntries(LANGS.map((l) => [l, `${url}${localePath(l, path)}`]));
  const page = (path: string, lastModified?: Date) =>
    LANGS.map((l) => ({ url: `${url}${localePath(l, path)}`, lastModified, alternates: { languages: languages(path) } }));

  return [
    ...["/", "/maqolalar", "/mualliflar", "/yonalishlar", "/yangiliklar", "/haqida"].flatMap((p) => page(p)),
    ...published.flatMap((a) => page(`/maqola/${a.id}`, a.updatedAt)),
    // Yangilik matni faqat o‘zbekcha — ruscha/inglizcha nusxasi canonical bilan o‘zbekchasiga ishora qiladi
    ...news.map((n) => ({ url: `${url}/yangiliklar/${n.id}`, lastModified: n.updatedAt })),
    ...teachers.flatMap((t) => page(`/oqituvchi/${t.slug}`, t.updatedAt)),
  ];
}
