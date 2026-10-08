import "server-only";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { titleIn, type ArticleStatus, type License } from "@/lib/article-rules";
import type { Lang } from "@/lib/langs";
import type { AcademicDegree, AcademicTitle } from "@/lib/profile-labels";
import { db } from "../db";
import { articleAuthors, articles, profiles, users } from "../db/schema";

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
    academicTitle: AcademicTitle | null;
    bio: string | null;
  };
  others: { id: number; title: string }[];
};

export async function loadArticleView(id: number, publishedOnly: boolean): Promise<ArticleView | null> {
  const [a] = await db
    .select()
    .from(articles)
    .where(publishedOnly ? and(eq(articles.id, id), eq(articles.status, "published")) : eq(articles.id, id))
    .limit(1);
  if (!a) return null;

  const [authors, [owner], others] = await Promise.all([
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
        academicTitle: profiles.academicTitle,
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
      academicTitle: visible ? owner.academicTitle : null,
      bio: visible ? owner.bio : null,
    },
    others: others.map((o) => ({ id: o.id, title: titleIn(o) })),
  };
}
