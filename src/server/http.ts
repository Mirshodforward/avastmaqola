import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { AUTH_ERRORS, AuthError, type AuthErrorCode } from "./auth/errors";
import { env } from "./env";

/**
 * Mijoz IP’si (IP bo‘yicha limitlar uchun). X-Forwarded-For’ning BIRINCHI qiymatini mijoz o‘zi yozib yuborishi mumkin,
 * shuning uchun avval nginx qo‘yadigan X-Real-IP ($remote_addr), bo‘lmasa oxirgi (proksi qo‘shgan) qiymat olinadi.
 */
export function clientMeta(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = request.headers.get("x-real-ip")?.trim() || forwarded?.split(",").at(-1)?.trim() || null;
  return { ip, userAgent: request.headers.get("user-agent") };
}

/** Boshqa saytdan yuborilgan so‘rovlarni rad etadi (cookie’dagi SameSite=Lax ustiga qo‘shimcha himoya). */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AuthError("forbidden");
  }
  const allowed = [
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
    new URL(env().APP_URL).host,
  ];
  if (!allowed.includes(originHost)) throw new AuthError("forbidden");
}

/** Eng katta JSON: uch tildagi annotatsiyali maqola qoralamasi ~40 KB */
const MAX_JSON_BYTES = 64 * 1024;

/**
 * Tana o‘qilishidan oldin hajmini tekshiradi. Content-Length’siz (chunked) so‘rov rad etiladi:
 * aks holda request.json()/formData() cheksiz tanani xotiraga yig‘ib, serverni to‘xtatishi mumkin.
 * Brauzer fetch() bu sarlavhani doim yuboradi.
 */
export function assertBodySize(request: Request, max: number, code: AuthErrorCode = "payload_too_large") {
  const length = request.headers.get("content-length");
  if (length === null || !(Number(length) <= max)) throw new AuthError(code);
}

export async function readJson<T extends z.ZodType>(request: Request, schema: T, maxBytes = MAX_JSON_BYTES): Promise<z.output<T>> {
  assertBodySize(request, maxBytes);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AuthError("validation");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      // "authors.1.familyName" kabi ichki maydonlar ham aniq ko‘rsatiladi
      const key = issue.path.length ? issue.path.join(".") : "_";
      fieldErrors[key] ??= issue.message;
    }
    throw new AuthError("validation", { fieldErrors });
  }
  return parsed.data;
}

export function errorResponse(error: unknown): Response {
  // Next.js ichki signallari (masalan, prerender paytida cookies()) bizning xato emas — ularni qaytaramiz
  unstable_rethrow(error);
  if (error instanceof AuthError) {
    const def: { status: number; message: string; field?: string } = AUTH_ERRORS[error.code];
    return Response.json(
      { ok: false, error: { code: error.code, message: def.message, field: def.field, ...error.details } },
      { status: def.status },
    );
  }
  console.error("[api] kutilmagan xato:", error);
  return Response.json(
    { ok: false, error: { code: "internal", message: "Serverda xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring." } },
    { status: 500 },
  );
}
