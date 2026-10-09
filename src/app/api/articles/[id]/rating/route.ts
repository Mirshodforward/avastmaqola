import { after } from "next/server";
import { parseArticleId } from "@/server/articles/schemas";
import { articleUrl } from "@/server/articles/seo";
import { AuthError } from "@/server/auth/errors";
import { getCurrentUser, requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, readJson } from "@/server/http";
import { ratingInputSchema } from "@/server/ratings/schemas";
import { getMyRating, saveMyRating } from "@/server/ratings/service";

type Ctx = RouteContext<"/api/articles/[id]/rating">;

async function articleId(ctx: Ctx) {
  const id = parseArticleId((await ctx.params).id);
  if (!id) throw new AuthError("not_found");
  return id;
}

/** Statik maqola sahifasidagi forma holati. Kirmagan foydalanuvchi — xato emas, me: null */
export async function GET(_request: Request, ctx: Ctx) {
  try {
    const id = await articleId(ctx);
    const user = await getCurrentUser();
    const me = user ? { name: `${user.firstName} ${user.lastName}`, ...(await getMyRating(id, user.id)) } : null;
    return Response.json({ ok: true, me }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const id = await articleId(ctx);
    const { rating, changed, wasPublic } = await saveMyRating(id, user.id, await readJson(request, ratingInputSchema, 8 * 1024));
    // Diskdagi eski nusxa (avvalgi chop etilgan baho bilan) server qayta ishga tushsa ham berilib qolmasin
    if (wasPublic) after(() => fetch(articleUrl(id)).catch(() => undefined));
    return Response.json({ ok: true, rating, changed });
  } catch (error) {
    return errorResponse(error);
  }
}
