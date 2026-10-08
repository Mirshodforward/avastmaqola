import { findArticlePdf } from "@/server/articles/public";
import { parseArticleId } from "@/server/articles/schemas";
import { getCurrentUser } from "@/server/auth/session";
import { readStoredFile } from "@/server/storage";

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(_request: Request, ctx: RouteContext<"/maqola/[id]/pdf">) {
  const id = parseArticleId((await ctx.params).id);
  if (!id) return notFound();
  const row = await findArticlePdf(id);
  if (!row?.pdfKey) return notFound();

  const isPublic = row.status === "published";
  if (!isPublic) {
    // Tasdiqlanmagan maqola PDF’i faqat muallifga va (yuborilgan bo‘lsa) adminga; qoralama — faqat muallifga
    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin" && row.status !== "draft";
    if (!user || (user.id !== row.userId && !isAdmin)) return notFound();
  }

  const data = await readStoredFile("articles", row.pdfKey).catch(() => null);
  if (!data) return notFound();
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="maqola-${id}.pdf"`,
      // Admin maqolani olib tashlasa, PDF ham tez yopilishi uchun qisqa kesh
      "cache-control": isPublic ? "public, max-age=300" : "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
