import "server-only";
import { and, asc, desc, eq, like, ne } from "drizzle-orm";
import { titleIn, type ArticleStatus, type License, type VenueType } from "@/lib/article-rules";
import type { Lang } from "@/lib/langs";
import type { AcademicDegree } from "@/lib/profile-labels";
import { db } from "../db";
import { articleAuthors, articles, profiles, users, zenodoDeposits } from "../db/schema";

/** Ommaviy sahifa, admin ko‘rib chiqishi va o‘qituvchi oldindan ko‘rishi uchun yagona ma’lumot shakli */
export type ArticleView = {
  id: number;
  ownerId: string;
  status: ArticleStatus;
  lang: Lang;
  titles: Record<Lang, string>;
  abstracts: Record<Lang, string>;
  keywords: Record<Lang, string[]>;
  license: License;
  pdfBytes: number | null;
  /** Maqola boshqa joyda chop etilgan bo‘lsa: jurnal yoki konferensiya to‘plami, DOI */
  publication: {
    type: VenueType | null;
    venue: string | null;
    volume: string | null;
    issue: string | null;
    pages: string | null;
    year: number | null;
    doi: string | null;
  } | null;
  /** Zenodo bergan DOI — faqat zenodo.org’niki (10.5281): sinov serverining DOI’si sahifaga chiqmaydi */
  zenodoDoi?: string | null;
  /** Portaldagi joyi: "3-son, 12-maqola" (chop etilgunicha — o‘qituvchi taklifi) */
  issueNo: number;
  issueSeq: number | null;
  /** Ko‘rib chiqilayotgan nusxa: admin qarori aynan shu yuborishga tegishli bo‘lishi uchun */
  submittedAt: Date | null;
  publishedAt: Date | null;
  updatedAt: Date;
  reviewNote: string | null;
  authors: { givenName: string; familyName: string; institution: string | null; orcid: string | null; isOwner: boolean }[];
  /** Tepadagi muallif bloki. Profil yopiq bo‘lsa, faqat maqoladagi ism va muassasa (rasm va havolasiz). */
  owner: {
    name: string;
    slug: string | null;
    photoKey: string | null;
    direction: string | null;
    institution: string | null;
    department: string | null;
    position: string | null;
    academicDegree: AcademicDegree | null;
    bio: string | null;
  };
  /** title — asl tilida; titles — sahifa tilidagisi uchun (bo‘sh bo‘lishi mumkin) */
  others: { id: number; title: string; titles: Record<Lang, string> }[];
};

export async function loadArticleView(id: number, publishedOnly: boolean): Promise<ArticleView | null> {
  const [a] = await db
    .select()
    .from(articles)
    .where(publishedOnly ? and(eq(articles.id, id), eq(articles.status, "published")) : eq(articles.id, id))
    .limit(1);
  if (!a) return null;

  const [authors, [owner], others, [zenodo]] = await Promise.all([
    db
      .select()
      .from(articleAuthors)
      .where(eq(articleAuthors.articleId, id))
      .orderBy(asc(articleAuthors.position)),
    db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        slug: profiles.slug,
        isPublic: profiles.isPublic,
        photoKey: profiles.photoKey,
        direction: profiles.direction,
        institution: profiles.institution,
        department: profiles.department,
        position: profiles.position,
        academicDegree: profiles.academicDegree,
        bio: profiles.bio,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, a.userId))
      .limit(1),
    db
      .select({ id: articles.id, lang: articles.lang, titleUz: articles.titleUz, titleRu: articles.titleRu, titleEn: articles.titleEn })
      .from(articles)
      .where(and(eq(articles.userId, a.userId), eq(articles.status, "published"), ne(articles.id, id)))
      .orderBy(desc(articles.publishedAt))
      .limit(5),
    db
      .select({ doi: zenodoDeposits.doi })
      .from(zenodoDeposits)
      .where(
        and(eq(zenodoDeposits.articleId, id), eq(zenodoDeposits.status, "published"), like(zenodoDeposits.doi, "10.5281/%")),
      )
      .limit(1),
  ]);

  const me = authors.find((x) => x.userId === a.userId);
  const visible = owner?.isPublic === true;
  return {
    id: a.id,
    ownerId: a.userId,
    status: a.status,
    lang: a.lang ?? "uz",
    titles: { uz: a.titleUz ?? "", ru: a.titleRu ?? "", en: a.titleEn ?? "" },
    abstracts: { uz: a.abstractUz ?? "", ru: a.abstractRu ?? "", en: a.abstractEn ?? "" },
    keywords: { uz: a.keywordsUz, ru: a.keywordsRu, en: a.keywordsEn },
    license: a.license,
    pdfBytes: a.pdfKey ? a.pdfBytes : null,
    publication:
      a.venue || a.doi
        ? { type: a.venueType, venue: a.venue, volume: a.volume, issue: a.issue, pages: a.pages, year: a.pubYear, doi: a.doi }
        : null,
    zenodoDoi: zenodo?.doi ?? null,
    issueNo: a.issueNo,
    issueSeq: a.issueSeq,
    submittedAt: a.submittedAt,
    publishedAt: a.publishedAt,
    updatedAt: a.updatedAt,
    reviewNote: a.reviewNote,
    authors: authors.map((x) => ({
      givenName: x.givenName,
      familyName: x.familyName,
      institution: x.institution,
      orcid: x.orcid,
      isOwner: x.userId === a.userId,
    })),
    owner: {
      name: visible ? `${owner.firstName} ${owner.lastName}` : me ? `${me.givenName} ${me.familyName}` : "Muallif",
      slug: visible ? owner.slug : null,
      photoKey: visible ? owner.photoKey : null,
      direction: visible ? owner.direction : null,
      institution: visible ? owner.institution : (me?.institution ?? null),
      department: visible ? owner.department : null,
      position: visible ? owner.position : null,
      academicDegree: visible ? owner.academicDegree : null,
      bio: visible ? owner.bio : null,
    },
    others: others.map((o) => ({
      id: o.id,
      title: titleIn(o),
      titles: { uz: o.titleUz ?? "", ru: o.titleRu ?? "", en: o.titleEn ?? "" },
    })),
  };
}
