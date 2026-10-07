import { destroyCurrentSession } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await destroyCurrentSession();
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
