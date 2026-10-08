import { draftSchema, parseArticleId } from "@/server/articles/schemas";
import { deleteArticle, saveDraft } from "@/server/articles/service";
import { AuthError } from "@/server/auth/errors";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, readJson } from "@/server/http";

type Ctx = RouteContext<"/api/articles/[id]">;

async function articleId(ctx: Ctx) {
  const id = parseArticleId((await ctx.params).id);
  if (!id) throw new AuthError("not_found");
  return id;
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const id = await articleId(ctx);
    await saveDraft(user.id, id, await readJson(request, draftSchema));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await deleteArticle(user.id, await articleId(ctx));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
