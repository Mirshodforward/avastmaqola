import { after } from "next/server";
import { issueLabel } from "@/lib/issue";
import { moveArticle } from "@/server/articles/review";
import { moveSchema, parseArticleId } from "@/server/articles/schemas";
import { articleUrl } from "@/server/articles/seo";
import { AuthError } from "@/server/auth/errors";
import { requireApiModerator } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, readJson } from "@/server/http";
import { notifyUser } from "@/server/notify";
import { warmAuthorPages } from "@/server/warm";

/** Chop etilgan maqolaning sonini yoki raqamini o‘zgartirish: moderator va admin */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/articles/[id]/issue">) {
  try {
    assertSameOrigin(request);
    await requireApiModerator();
    const id = parseArticleId((await ctx.params).id);
    if (!id) throw new AuthError("not_found");
    const { place } = await readJson(request, moveSchema);

    const { userId, title } = await moveArticle(id, place);
    after(async () => {
      // Diskdagi sahifalar eski raqam bilan qolmasin: maqola va muallif profili qayta chiziladi
      await warmAuthorPages(userId, [articleUrl(id)]).catch(() => undefined);
      await notifyUser(userId, `Maqolangiz joyi o‘zgardi: ${issueLabel(place.issueNo, place.issueSeq)} — «${title}».\n${articleUrl(id)}`);
    });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
