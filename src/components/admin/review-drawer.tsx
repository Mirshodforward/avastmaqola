import Link from "next/link";
import { ArticleView } from "@/components/article/article-view";
import { ReviewPanel } from "@/components/article/review-panel";
import { StatusChip } from "@/components/article/status-chip";
import { ARTICLE_LIMITS } from "@/lib/article-rules";
import { formatBytes, formatDate } from "@/lib/format";
import { issuePlaceStatus } from "@/server/articles/issue";
import { parseArticleId } from "@/server/articles/schemas";
import { articleUrl } from "@/server/articles/seo";
import { loadArticleView } from "@/server/articles/view";
import { ArticleDrawer } from "./article-drawer";

/**
 * Ro‘yxat ustida ochiladigan ko‘rib chiqish paneli: chapda maqola sahifasi qanday ochilishi, o‘ngda qaror.
 * Qoralama (hech qachon yuborilmagan) faqat muallifniki — adminga ko‘rsatilmaydi.
 * moderator — /moderator’dan: admin sahifasiga havola va saytdan olib tashlash yo‘q.
 */
export async function ReviewDrawer({
  view,
  closeHref,
  moderator = false,
}: {
  view: string | null;
  closeHref: string;
  moderator?: boolean;
}) {
  const id = view ? parseArticleId(view) : null;
  const v = id ? await loadArticleView(id, false) : null;
  if (!v || v.status === "draft") return null;
  const place = await issuePlaceStatus(v.id, v.issueNo, v.issueSeq);

  return (
    <ArticleDrawer label={`Maqola №${v.id}`} closeHref={closeHref}>
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-paper px-5 py-4 sm:px-8">
          <p className="font-serif text-xl font-semibold">Maqola №{v.id}</p>
          <StatusChip status={v.status} />
          {v.submittedAt && <p className="text-sm text-muted">Yuborilgan: {formatDate(v.submittedAt)}</p>}
          <div className="ml-auto flex items-center gap-2">
            {!moderator && (
              <Link href={`/admin/articles/${v.id}`} className="btn btn-ghost">
                To‘liq sahifa
              </Link>
            )}
            <Link href={closeHref} scroll={false} className="btn btn-secondary" aria-label="Panelni yopish">
              <span aria-hidden="true">✕</span> Yopish
            </Link>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            {/* Qaror bloki telefonda maqoladan oldin: uzun matnni oxirigacha aylantirmasdan qaror qilsa bo‘ladi */}
            <aside className="space-y-4 lg:sticky lg:top-0 lg:order-last lg:self-start">
              {/* key: boshqa maqolaga o‘tilganda (Orqaga/Oldinga) eski maqolaning izohi va raqami qolib ketmasin */}
              <ReviewPanel
                key={v.id}
                id={v.id}
                status={v.status}
                submittedAt={v.submittedAt ? new Date(v.submittedAt).toISOString() : null}
                place={{ issueNo: v.issueNo, issueSeq: v.issueSeq, ...place }}
                canUnpublish={!moderator}
                zenodoDoi={v.zenodoDoi ?? null}
              />
              {v.pdfBytes !== null && v.pdfBytes > ARTICLE_LIMITS.pdfScholarBytes && (
                <p className="rounded-xl border border-line bg-paper p-4 text-sm text-muted">
                  PDF {formatBytes(v.pdfBytes)}: 5 MB dan katta faylni Google Scholar o‘qimasligi mumkin.
                </p>
              )}
            </aside>
            <div className="min-w-0 break-words">
              <ArticleView v={v} absoluteUrl={articleUrl(v.id)} preview={v.status !== "published"} />
            </div>
          </div>
        </div>
      </div>
    </ArticleDrawer>
  );
}
