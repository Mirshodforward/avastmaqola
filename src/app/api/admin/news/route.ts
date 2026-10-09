import { requireApiAdmin } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http";
import { createNews } from "@/server/news/service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    return Response.json({ ok: true, id: await createNews() });
  } catch (error) {
    return errorResponse(error);
  }
}
