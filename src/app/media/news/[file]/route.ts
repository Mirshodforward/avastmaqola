import { and, eq } from "drizzle-orm";
import { requireApiAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { news } from "@/server/db/schema";
import { readStoredFile } from "@/server/storage";

// Faqat bizning nom shaklimiz: {newsId}-{12 hex}.webp — boshqa har qanday so‘rov 404
const FILE_NAME = /^([1-9][0-9]{0,8})-([0-9a-f]{12})\.webp$/;

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(_request: Request, { params }: RouteContext<"/media/news/[file]">) {
  const { file } = await params;
  const match = FILE_NAME.exec(file);
  if (!match) return notFound();
  const [, id, version] = match;

  // Rasm faqat yangilikning joriy muqovasi bo‘lsa beriladi. Qoralamaniki — faqat adminga (forma ko‘rsatadi)
  const [row] = await db
    .select({ publishedAt: news.publishedAt })
    .from(news)
    .where(and(eq(news.id, Number(id)), eq(news.imageKey, `${id}-${version}`)))
    .limit(1);
  if (!row) return notFound();
  const published = row.publishedAt !== null;
  if (!published) {
    try {
      await requireApiAdmin();
    } catch {
      return notFound();
    }
  }

  const data = await readStoredFile("news", file).catch(() => null);
  if (!data) return notFound();
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": "image/webp",
      "cache-control": published ? "public, max-age=86400" : "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
