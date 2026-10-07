import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "../db";
import { sessions, users } from "../db/schema";
import { AUTH, FLOW_COOKIE, FLOW_COOKIE_PATH, SESSION_COOKIE } from "./config";
import { newToken, sha256 } from "./crypto";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  orcid: string;
  orcidVerified: boolean;
  role: string;
};

const secure = process.env.NODE_ENV === "production";

export async function createSession(
  executor: Db | Tx,
  userId: string,
  meta: { ip: string | null; userAgent: string | null },
) {
  const token = newToken();
  const [row] = await executor
    .insert(sessions)
    .values({
      userId,
      tokenHash: sha256(token),
      expiresAt: sql`now() + make_interval(days => ${AUTH.sessionTtlDays})`,
      ip: meta.ip,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    })
    .returning({ expiresAt: sessions.expiresAt });
  return { token, expiresAt: row.expiresAt };
}

/** Joriy foydalanuvchi (bitta so‘rov ichida bir marta o‘qiladi). Sessiya bo‘lmasa — null. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      orcid: users.orcid,
      orcidVerifiedAt: users.orcidVerifiedAt,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, sql`now()`)))
    .limit(1);
  if (!row) return null;

  const { orcidVerifiedAt, ...user } = row;
  return { ...user, orcidVerified: orcidVerifiedAt !== null };
});

/** Himoyalangan sahifalar uchun: sessiya bo‘lmasa /login’ga yo‘naltiradi. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function setFlowCookie(token: string) {
  (await cookies()).set(FLOW_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: FLOW_COOKIE_PATH,
    maxAge: AUTH.flowTtlSeconds,
  });
}

export async function readFlowCookie(): Promise<string | null> {
  return (await cookies()).get(FLOW_COOKIE)?.value ?? null;
}

export async function clearFlowCookie() {
  (await cookies()).set(FLOW_COOKIE, "", { path: FLOW_COOKIE_PATH, maxAge: 0 });
}
