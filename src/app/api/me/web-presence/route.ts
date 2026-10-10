import { AuthError } from "@/server/auth/errors";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http";
import { startPresenceSearch } from "@/server/web-presence/service";

/**
 * Internetdagi ma’lumotlarni izlash: javob NDJSON oqimi (src/lib/web-presence.ts → PresenceEvent).
 * So‘rov tanasi qabul qilinmaydi — kimni izlash faqat sessiyadan (o‘qituvchining o‘z profili) ma’lum.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    if (Number(request.headers.get("content-length") ?? 0) > 0) throw new AuthError("payload_too_large");
    const body = await startPresenceSearch(user.id);
    return new Response(body, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
        // nginx javobni buferlamasin: qadamlar yuz berishi bilan ko‘rinsin
        "x-accel-buffering": "no",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
