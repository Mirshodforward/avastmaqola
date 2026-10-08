import "server-only";
import { avatarUrl } from "@/lib/media";
import { siteUrl } from "../site";
import type { PublicProfile } from "./service";

const HONORIFIC: Partial<Record<string, string>> = { phd: "PhD", dsc: "DSc" };

function compact<T>(items: (T | null | undefined | false | "")[]): T[] {
  return items.filter((item): item is T => Boolean(item));
}

export function profileUrl(slug: string): string {
  return `${siteUrl()}/oqituvchi/${slug}`;
}

/** Person. @id barcha sahifalarda bir xil: maqolalardagi muallif ham shu shaxsga bog‘lanadi. */
export function personJsonLd(p: PublicProfile) {
  const url = profileUrl(p.slug);
  // Tasdiqlanmagan ORCID iD’ni har kim yozishi mumkin: qidiruv va AI tizimlariga "bu o‘sha olim" deb
  // tasdiqlamaymiz (sahifada "tasdiqlanmagan" belgisi bilan ko‘rinaveradi). ORCID OAuth’dan keyin ochiladi
  const orcid = p.orcidVerified ? p.orcid : null;
  const sameAs = compact([
    orcid && `https://orcid.org/${orcid}`,
    p.googleScholarUrl,
    p.researchgateUrl,
    p.scopusAuthorId && `https://www.scopus.com/authid/detail.uri?authorId=${p.scopusAuthorId}`,
    p.websiteUrl,
  ]);
  const identifier = compact([
    orcid && { "@type": "PropertyValue", propertyID: "ORCID", value: orcid },
    p.scopusAuthorId && { "@type": "PropertyValue", propertyID: "Scopus Author ID", value: p.scopusAuthorId },
    p.researcherId && { "@type": "PropertyValue", propertyID: "ResearcherID", value: p.researcherId },
  ]);
  const honorific = p.academicDegree ? HONORIFIC[p.academicDegree] : undefined;

  return {
    "@type": "Person",
    "@id": `${url}#person`,
    url,
    name: `${p.firstName} ${p.lastName}`,
    givenName: p.firstName,
    familyName: p.lastName,
    ...(p.patronymic ? { additionalName: p.patronymic } : {}),
    ...(p.publishedName ? { alternateName: p.publishedName } : {}),
    ...(honorific ? { honorificSuffix: honorific } : {}),
    jobTitle: p.position,
    worksFor: { "@type": "CollegeOrUniversity", name: p.institution },
    ...(p.bio ? { description: p.bio.slice(0, 300) } : {}),
    // Rasm bo‘lmasa image umuman yozilmaydi (o‘rinbosar rasm strukturali ma’lumotga qo‘yilmaydi)
    ...(p.photoKey ? { image: `${siteUrl()}${avatarUrl(p.photoKey, 512)}` } : {}),
    knowsAbout: [p.direction, ...p.keywords],
    ...(sameAs.length ? { sameAs } : {}),
    ...(identifier.length ? { identifier } : {}),
  };
}

export function profilePageJsonLd(p: PublicProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: profileUrl(p.slug),
    dateCreated: new Date(p.createdAt).toISOString(),
    dateModified: new Date(p.updatedAt).toISOString(),
    mainEntity: personJsonLd(p),
  };
}
