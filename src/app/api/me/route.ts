import { eq } from "drizzle-orm";
import { avatarUrl } from "@/lib/media";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { profiles } from "@/server/db/schema";
import { errorResponse } from "@/server/http";

/**
 * Ommaviy (statik) sahifalar header’i uchun: kim kirgan. Kirmagan — user: null (xato emas).
 * /api/* proxy’dan o‘tadi — eskirgan access token shu yerda yangilanadi.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ ok: true, user: null }, { headers: { "cache-control": "private, no-store" } });
    const [profile] = await db.select({ photoKey: profiles.photoKey }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    return Response.json(
      {
        ok: true,
        user: {
          name: `${user.firstName} ${user.lastName}`,
          photoUrl: profile?.photoKey ? avatarUrl(profile.photoKey, 128) : null,
          role: user.role,
        },
      },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
