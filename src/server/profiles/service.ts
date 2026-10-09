import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { cacheTag, revalidateTag } from "next/cache";
import { slugify } from "@/lib/slug";
import { AuthError } from "../auth/errors";
import { db, type Tx } from "../db";
import { profiles, users } from "../db/schema";
import { lookupOrcid } from "../orcid/client";
import { deleteFile, saveFile } from "../storage";
import { MAX_PHOTO_BYTES, processAvatar } from "./photo";
import type { ProfileInput } from "./schemas";

/** generateStaticParams uchun: hech bir profilga mos kelmaydi (slug’da "_" bo‘lishi mumkin emas) */
export const PLACEHOLDER_SLUG = "__placeholder__";

/** Ommaviy profil sahifasining keshi */
const profileTag = (slug: string) => `profile:${slug}`;
/** Shu muallif ko‘rsatilgan barcha sahifalar (profil, maqolalar) */
export const authorTag = (userId: string) => `author:${userId}`;
/** Ochiq profillar ro‘yxati (/mualliflar, /yonalishlar) */
export const TEACHERS_TAG = "teachers";

function invalidate(userId: string, slug: string) {
  // Route handler’dan chaqiriladi, shuning uchun updateTag emas: darhol eskirtiramiz
  revalidateTag(profileTag(slug), { expire: 0 });
  revalidateTag(authorTag(userId), { expire: 0 });
  revalidateTag(TEACHERS_TAG, { expire: 0 });
}

export async function getEditableProfile(userId: string) {
  const [row] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      orcid: users.orcid,
      profile: profiles,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

async function uniqueSlug(tx: Tx, fullName: string) {
  const base = slugify(fullName) || "oqituvchi";
  const taken = await tx
    .select({ slug: profiles.slug })
    .from(profiles)
    .where(sql`${profiles.slug} ~ ${`^${base}(-[0-9]+)?$`}`);
  const used = new Set(taken.map((r) => r.slug));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function saveProfile(userId: string, input: ProfileInput) {
  const { firstName, lastName, orcid, ...fields } = input;

  const [current] = await db.select({ orcid: users.orcid }).from(users).where(eq(users.id, userId)).limit(1);
  const orcidChanged = orcid !== current?.orcid;
  if (orcid && orcidChanged) {
    const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.orcid, orcid)).limit(1);
    if (owner) throw new AuthError("orcid_taken");
    // ORCID javob bermasa saqlashni to‘xtatmaymiz, faqat aniq "bunday iD yo‘q" bo‘lsa rad etamiz
    if ((await lookupOrcid(orcid)).status === "not_found") throw new AuthError("orcid_not_found");
  }

  const slug = await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ firstName, lastName, orcid, ...(orcidChanged ? { orcidVerifiedAt: null } : {}) })
      .where(eq(users.id, userId));

    const [existing] = await tx
      .select({ slug: profiles.slug })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    if (existing) {
      await tx.update(profiles).set(fields).where(eq(profiles.userId, userId));
      return existing.slug;
    }
    const created = await uniqueSlug(tx, `${firstName} ${lastName}`);
    await tx.insert(profiles).values({ userId, slug: created, ...fields });
    return created;
  });

  invalidate(userId, slug);
  return { slug };
}

const avatarFiles = (key: string) => [`${key}-512.webp`, `${key}-128.webp`];

export async function setProfilePhoto(userId: string, file: File) {
  if (file.size > MAX_PHOTO_BYTES) throw new AuthError("photo_too_large");
  const [profile] = await db
    .select({ slug: profiles.slug, photoKey: profiles.photoKey })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (!profile) throw new AuthError("profile_required");

  const { large, small } = await processAvatar(Buffer.from(await file.arrayBuffer()));
  // Har yuklashda yangi kalit: eski URL’lar brauzer keshida abadiy qolsa ham, yangi rasm darhol ko‘rinadi
  const key = `${userId}-${randomBytes(6).toString("hex")}`;
  const [largeName, smallName] = avatarFiles(key);
  await saveFile("avatars", largeName, large);
  await saveFile("avatars", smallName, small);
  await db.update(profiles).set({ photoKey: key }).where(eq(profiles.userId, userId));
  if (profile.photoKey) await Promise.all(avatarFiles(profile.photoKey).map((n) => deleteFile("avatars", n)));

  invalidate(userId, profile.slug);
  return { photoKey: key };
}

export async function removeProfilePhoto(userId: string) {
  const [profile] = await db
    .select({ slug: profiles.slug, photoKey: profiles.photoKey })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (!profile?.photoKey) return;
  await db.update(profiles).set({ photoKey: null }).where(eq(profiles.userId, userId));
  await Promise.all(avatarFiles(profile.photoKey).map((n) => deleteFile("avatars", n)));
  invalidate(userId, profile.slug);
}

/** Ommaviy sahifa uchun: faqat ochiq maydonlar (telefon va Telegram hech qachon tanlanmaydi). */
export async function getPublicProfile(slug: string) {
  "use cache";
  cacheTag(profileTag(slug));
  // Slug ko‘rinishiga mos kelmagan so‘rovlar (botlar, build’dagi o‘rinbosar) bazaga yetib bormaydi
  if (slug.length > 80 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;

  const [row] = await db
    .select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      orcid: users.orcid,
      orcidVerified: sql<boolean>`${users.orcidVerifiedAt} is not null`,
      slug: profiles.slug,
      patronymic: profiles.patronymic,
      position: profiles.position,
      academicDegree: profiles.academicDegree,
      institution: profiles.institution,
      department: profiles.department,
      direction: profiles.direction,
      bio: profiles.bio,
      keywords: profiles.keywords,
      googleScholarUrl: profiles.googleScholarUrl,
      scopusAuthorId: profiles.scopusAuthorId,
      photoKey: profiles.photoKey,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.slug, slug), eq(profiles.isPublic, true)))
    .limit(1);
  if (row) cacheTag(authorTag(row.userId));
  return row ?? null;
}

export type PublicProfile = NonNullable<Awaited<ReturnType<typeof getPublicProfile>>>;
