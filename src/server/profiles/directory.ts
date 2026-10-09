import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { ARTICLES_TAG } from "../articles/public";
import { db } from "../db";
import { articles, profiles, users } from "../db/schema";
import { TEACHERS_TAG } from "./service";

/** /mualliflar va /yonalishlar uchun ochiq profillar. Profil o‘zgarganda yoki maqola chop etilganda teglar orqali yangilanadi. */
export async function listPublicTeachers() {
  "use cache";
  cacheTag(TEACHERS_TAG, ARTICLES_TAG);
  return db
    .select({
      slug: profiles.slug,
      firstName: users.firstName,
      lastName: users.lastName,
      photoKey: profiles.photoKey,
      position: profiles.position,
      academicDegree: profiles.academicDegree,
      institution: profiles.institution,
      department: profiles.department,
      direction: profiles.direction,
      published: sql<number>`(select count(*) from ${articles} where ${articles.userId} = ${profiles.userId} and ${articles.status} = 'published')`.mapWith(Number),
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.isPublic, true))
    .orderBy(asc(users.lastName), asc(users.firstName));
}

export type PublicTeacher = Awaited<ReturnType<typeof listPublicTeachers>>[number];

type DirectionGroup = { name: string; teachers: PublicTeacher[]; published: number };

/** Yo‘nalish erkin matn: katta-kichik harf va ortiqcha bo‘shliq farqi bilan yozilganlari bitta guruhga tushadi */
export function groupByDirection(teachers: PublicTeacher[]): DirectionGroup[] {
  const groups = new Map<string, DirectionGroup>();
  for (const t of teachers) {
    const name = t.direction.trim().replace(/\s+/g, " ");
    const key = name.toLowerCase();
    const group = groups.get(key) ?? { name, teachers: [], published: 0 };
    group.teachers.push(t);
    group.published += t.published;
    groups.set(key, group);
  }
  return [...groups.values()].sort(
    (a, b) => b.published - a.published || b.teachers.length - a.teachers.length || a.name.localeCompare(b.name, "uz"),
  );
}
