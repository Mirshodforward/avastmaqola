import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { profiles } from "@/server/db/schema";
import { readStoredFile } from "@/server/storage";

// Faqat bizning nom shaklimiz: {userId}-{12 hex}-{512|128}.webp — boshqa har qanday so‘rov 404
const FILE_NAME = /^([0-9a-f-]{36})-([0-9a-f]{12})-(512|128)\.webp$/;

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(_request: Request, { params }: RouteContext<"/media/avatars/[file]">) {
  const { file } = await params;
  const match = FILE_NAME.exec(file);
  if (!match) return notFound();
  const [, userId, version] = match;

  // Rasm faqat joriy va ommaviy profilniki bo‘lsa hammaga beriladi. Profil yopilsa (yoki rasm almashsa),
  // ilgari tarqalgan havola ham yopiladi; egasi o‘z rasmini kabinetda ko‘raveradi
  const [profile] = await db
    .select({ isPublic: profiles.isPublic })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), eq(profiles.photoKey, `${userId}-${version}`)))
    .limit(1);
  if (!profile) return notFound();
  const isPublic = profile.isPublic;
  if (!isPublic && (await getCurrentUser())?.id !== userId) return notFound();

  const data = await readStoredFile("avatars", file).catch(() => null);
  if (!data) return notFound();
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": "image/webp",
      // Fayl nomi har yuklashda o‘zgaradi, lekin abadiy (immutable) emas: profil yopilsa, keshlar bir kunda tozalansin
      "cache-control": isPublic ? "public, max-age=86400" : "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
