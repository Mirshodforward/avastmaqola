import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { AUTH_ERRORS, AuthError } from "./auth/errors";
import { env } from "./env";

export function clientMeta(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
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

export async function readJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.output<T>> {
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
      const key = String(issue.path[0] ?? "_");
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
