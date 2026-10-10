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

const TITLE_ID = "review-drawer-title";

/**
 * Ro‘yxat ustida ochiladigan ko‘rib chiqish paneli: chapda maqola sahifasi qanday ochilishi, o‘ngda qaror.
 * Qoralama (hech qachon yuborilmagan) faqat muallifniki — adminga ko‘rsatilmaydi.
 * moderator — /moderator’dan: saytdan olib tashlash yo‘q.
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
    <ArticleDrawer articleId={v.id} titleId={TITLE_ID} closeHref={closeHref}>
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-line bg-paper px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {/* Panel nomi (aria-labelledby); ochilganda fokus shu yerda — u bosiladigan element emas, halqasiz */}
              <h2 id={TITLE_ID} tabIndex={-1} className="font-serif text-xl font-semibold outline-none!">
                Maqola №{v.id}
              </h2>
              <StatusChip status={v.status} />
            </div>
            {v.submittedAt && <p className="mt-1 text-sm text-muted">Yuborilgan: {formatDate(v.submittedAt)}</p>}
          </div>
          {/* Telefonda faqat belgi (nomi aria-label’da): sarlavha va holat bir qatorga sig‘adi */}
          <Link href={closeHref} scroll={false} className="btn btn-secondary shrink-0 max-sm:px-3" aria-label="Panelni yopish">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 max-sm:size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
            <span className="max-sm:sr-only">Yopish</span>
          </Link>
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
                <p className="text-sm text-muted">PDF {formatBytes(v.pdfBytes)} — Google Scholar uchun katta (5 MB gacha).</p>
              )}
            </aside>
            <div className="min-w-0 break-words">
              <ArticleView v={v} absoluteUrl={articleUrl(v.id)} preview={v.status !== "published"} allLangs />
            </div>
          </div>
        </div>
      </div>
    </ArticleDrawer>
  );
}
