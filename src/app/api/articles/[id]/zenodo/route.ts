import { cookies } from "next/headers";
import { z } from "zod";
import { parseArticleId } from "@/server/articles/schemas";
import { AuthError } from "@/server/auth/errors";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, readJson } from "@/server/http";
import { authorizeUrl, zenodoConfig } from "@/server/zenodo/client";
import { ZENODO_COOKIE, ZENODO_COOKIE_PATH, startDeposit, zenodoState } from "@/server/zenodo/service";

// rights — o‘qituvchining tasdig‘i, hash — u ko‘rgan yozuv (server yozuvni bazadan qayta quradi va solishtiradi)
const startSchema = z.object({
  rights: z.literal(true, "Avval tasdiqlang."),
  hash: z.string().regex(/^[\w-]{43}$/),
});

/** Zenodo’ga joylashni boshlash: brauzer o‘tadigan ruxsat sahifasi manzilini qaytaradi */
export async function POST(request: Request, ctx: RouteContext<"/api/articles/[id]/zenodo">) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const id = parseArticleId((await ctx.params).id);
    if (!id) throw new AuthError("not_found");
    const { hash } = await readJson(request, startSchema);
    // Zenodo sozlanmagan bo‘lsa bu imkoniyat yo‘q (panel ham ko‘rinmaydi)
    const cfg = zenodoConfig();
    if (!cfg) throw new AuthError("not_found");

    const nonce = await startDeposit(cfg, user.id, id, hash);
    // Bir soat: o‘qituvchi Zenodo’da ro‘yxatdan ham o‘tishi mumkin. Yangi start eskisini almashtiradi
    (await cookies()).set(ZENODO_COOKIE, `${id}.${nonce}.${hash}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: ZENODO_COOKIE_PATH,
      maxAge: 3600,
    });
    return Response.json({ ok: true, url: authorizeUrl(cfg, zenodoState(user.id, id, nonce, hash)) });
  } catch (error) {
    return errorResponse(error);
  }
}
