import { after } from "next/server";
import { avatarUrl } from "@/lib/media";
import { AuthError } from "@/server/auth/errors";
import { requireApiUser } from "@/server/auth/session";
import { assertBodySize, assertSameOrigin, errorResponse } from "@/server/http";
import { MAX_PHOTO_BYTES } from "@/server/profiles/photo";
import { removeProfilePhoto, setProfilePhoto } from "@/server/profiles/service";
import { warmAuthorPages } from "@/server/warm";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    // Katta faylni xotiraga o‘qishdan oldin rad etamiz (multipart sarlavhalari uchun ozgina zaxira)
    assertBodySize(request, MAX_PHOTO_BYTES + 64 * 1024, "photo_too_large");
    const photo = (await request.formData()).get("photo");
    if (!(photo instanceof File)) throw new AuthError("photo_invalid");

    const { photoKey } = await setProfilePhoto(user.id, photo);
    // Eski rasm fayli o‘chdi: unga havola qilgan sahifalar darhol qayta yaratiladi
    after(() => warmAuthorPages(user.id));
    return Response.json({ ok: true, photoUrl: avatarUrl(photoKey, 512) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await removeProfilePhoto(user.id);
    after(() => warmAuthorPages(user.id));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
