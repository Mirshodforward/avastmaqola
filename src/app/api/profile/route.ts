import { after } from "next/server";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, readJson } from "@/server/http";
import { profileSchema } from "@/server/profiles/schemas";
import { saveProfile } from "@/server/profiles/service";
import { warmAuthorPages } from "@/server/warm";

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = await readJson(request, profileSchema);
    const { slug } = await saveProfile(user.id, input);
    // Profil va maqola sahifalaridagi muallif bloki darhol qayta yaratiladi (profil yopilgan bo‘lsa ham)
    after(() => warmAuthorPages(user.id));
    return Response.json({ ok: true, slug });
  } catch (error) {
    return errorResponse(error);
  }
}
