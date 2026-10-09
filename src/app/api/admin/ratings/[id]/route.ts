import { after } from "next/server";
import { parseArticleId } from "@/server/articles/schemas";
import { articleUrl } from "@/server/articles/seo";
import { AuthError } from "@/server/auth/errors";
import { requireApiAdmin } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, readJson } from "@/server/http";
import { ratingDecisionSchema } from "@/server/ratings/schemas";
import { decideRating } from "@/server/ratings/service";

/** Iqtibos moderatsiyasi: chop etish yoki rad etish */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/ratings/[id]">) {
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    const id = parseArticleId((await ctx.params).id); // raqam qoidasi bir xil: musbat butun son
    if (!id) throw new AuthError("not_found");
    const { action, updatedAt } = await readJson(request, ratingDecisionSchema);
    const articleId = await decideRating(id, action, updatedAt);
    // Maqola sahifasi darhol qayta yaratiladi: diskdagi eski nusxa qayta ishga tushishda berilib qolmasin
    after(() => fetch(articleUrl(articleId)).catch(() => undefined));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
