import "server-only";
import { LICENSE_INFO } from "@/lib/article-rules";
import { UNIVERSITY_NAME } from "@/lib/brand";
import { formatBytes, scholarDate, truncate } from "@/lib/format";
import { profileUrl } from "../profiles/json-ld";
import { siteUrl } from "../site";
import type { ArticleView } from "./view";

export const articleUrl = (id: number) => `${siteUrl()}/maqola/${id}`;
export const pdfUrl = (id: number) => `${siteUrl()}/maqola/${id}/pdf`;

/**
 * Google Scholar teglari (Highwire Press). Rasmiy ro‘yxatdagi uchta majburiy teg + PDF havolasi.
 * Mualliflar sahifadagi tartibda, ism "Familiya, Ism" ko‘rinishida, unvon va muassasasiz.
 */
export function citationMeta(v: ArticleView): Record<string, string | string[]> {
  return {
    citation_title: v.titles[v.lang],
    citation_author: v.authors.map((a) => `${a.familyName}, ${a.givenName}`),
    ...(v.publishedAt ? { citation_publication_date: scholarDate(v.publishedAt) } : {}),
    ...(v.pdfBytes ? { citation_pdf_url: pdfUrl(v.id) } : {}),
  };
}

/** Google qidiruvi va AI tizimlari uchun (Scholar JSON-LD’ni o‘qimaydi) */
export function articleJsonLd(v: ArticleView) {
  const url = articleUrl(v.id);
  const site = siteUrl();
  const title = v.titles[v.lang];
  const license = LICENSE_INFO[v.license].url;
  // Asosiy til ingliz bo‘lmasa, inglizcha sarlavha xalqaro qidiruv uchun muqobil sarlavha bo‘ladi
  const alternative = v.lang !== "en" ? v.titles.en : v.titles.uz;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ScholarlyArticle",
        "@id": `${url}#article`,
        url,
        mainEntityOfPage: url,
        name: title,
        headline: truncate(title, 110),
        ...(alternative ? { alternativeHeadline: alternative } : {}),
        abstract: v.abstracts[v.lang],
        inLanguage: v.lang,
        keywords: v.keywords[v.lang].join(", "),
        ...(v.publishedAt ? { datePublished: new Date(v.publishedAt).toISOString() } : {}),
        dateModified: new Date(v.updatedAt).toISOString(),
        author: v.authors.map((a) =>
          a.isOwner && v.owner.slug
            ? { "@type": "Person", "@id": `${profileUrl(v.owner.slug)}#person`, name: v.owner.name, url: profileUrl(v.owner.slug) }
            : {
                "@type": "Person",
                name: `${a.givenName} ${a.familyName}`,
                ...(a.institution ? { affiliation: { "@type": "Organization", name: a.institution } } : {}),
                ...(a.orcid
                  ? {
                      sameAs: `https://orcid.org/${a.orcid}`,
                      identifier: { "@type": "PropertyValue", propertyID: "ORCID", value: a.orcid },
                    }
                  : {}),
              },
        ),
        publisher: { "@type": "CollegeOrUniversity", "@id": `${site}/#university`, name: UNIVERSITY_NAME },
        ...(license ? { license } : {}),
        isAccessibleForFree: true,
        ...(v.pdfBytes
          ? {
              encoding: {
                "@type": "MediaObject",
                contentUrl: pdfUrl(v.id),
                encodingFormat: "application/pdf",
                contentSize: formatBytes(v.pdfBytes),
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: `${site}/` },
          { "@type": "ListItem", position: 2, name: "Maqolalar", item: `${site}/maqolalar` },
          { "@type": "ListItem", position: 3, name: truncate(title, 80), item: url },
        ],
      },
    ],
  };
}
