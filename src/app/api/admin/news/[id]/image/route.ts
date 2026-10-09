import { newsImageUrl } from "@/lib/media";
import { AuthError } from "@/server/auth/errors";
import { requireApiAdmin } from "@/server/auth/session";
import { assertBodySize, assertSameOrigin, errorResponse } from "@/server/http";
import { parseNewsId } from "@/server/news/schemas";
import { removeNewsImage, setNewsImage } from "@/server/news/service";
import { MAX_PHOTO_BYTES } from "@/server/profiles/photo";

async function newsId(ctx: RouteContext<"/api/admin/news/[id]/image">) {
  const id = parseNewsId((await ctx.params).id);
  if (!id) throw new AuthError("not_found");
  return id;
}

export async function POST(request: Request, ctx: RouteContext<"/api/admin/news/[id]/image">) {
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    const id = await newsId(ctx);
    // Katta faylni xotiraga o‘qishdan oldin rad etamiz (multipart sarlavhalari uchun ozgina zaxira)
    assertBodySize(request, MAX_PHOTO_BYTES + 64 * 1024, "photo_too_large");
    const photo = (await request.formData()).get("photo");
    if (!(photo instanceof File)) throw new AuthError("photo_invalid");
    return Response.json({ ok: true, imageUrl: newsImageUrl(await setNewsImage(id, photo)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/news/[id]/image">) {
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    await removeNewsImage(await newsId(ctx));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
