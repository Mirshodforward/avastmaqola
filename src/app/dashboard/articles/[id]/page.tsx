import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleEditor, type EditorValues } from "@/components/article/article-editor";
import { ArticleView } from "@/components/article/article-view";
import { StatusChip } from "@/components/article/status-chip";
import { ZenodoPanel } from "@/components/article/zenodo-panel";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard/shell";
import { EDITABLE_STATUSES, titleIn } from "@/lib/article-rules";
import { formatDate } from "@/lib/format";
import { aiClient } from "@/server/ai/client";
import { parseArticleId } from "@/server/articles/schemas";
import { articleUrl } from "@/server/articles/seo";
import { getOwnArticle, toFields } from "@/server/articles/service";
import { loadArticleView } from "@/server/articles/view";
import { requireUser } from "@/server/auth/session";
import { getEditableProfile } from "@/server/profiles/service";
import { zenodoConfig } from "@/server/zenodo/client";
import { loadZenodoPanel, zenodoFlash } from "@/server/zenodo/service";

type Props = PageProps<"/dashboard/articles/[id]">;

export const metadata: Metadata = { title: "Maqola" };

export default function ArticleEditPage({ params, searchParams }: Props) {
  // Ko‘pincha muharrir (wide) ochiladi — skelet header’i ham shu enda, yuklangach sakramasin
  return (
    <Suspense fallback={<DashboardSkeleton wide />}>
      <ArticleWorkspace params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ArticleWorkspace({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const user = await requireUser();
  const id = parseArticleId((await params).id);
  const own = id ? await getOwnArticle(user.id, id) : null;
  if (!own) notFound();
  const { article } = own;
  const admin = user.role === "admin";

  if (EDITABLE_STATUSES.includes(article.status)) {
    const f = toFields(own);
    const initial: EditorValues = {
      lang: f.lang ?? "",
      license: f.license,
      titleUz: f.titleUz,
      titleRu: f.titleRu,
      titleEn: f.titleEn,
      abstractUz: f.abstractUz,
      abstractRu: f.abstractRu,
      abstractEn: f.abstractEn,
      keywordsUz: f.keywordsUz.join(", "),
      keywordsRu: f.keywordsRu.join(", "),
      keywordsEn: f.keywordsEn.join(", "),
      venueType: f.venueType ?? "",
      venue: f.venue,
      volume: f.volume,
      issue: f.issue,
      pages: f.pages,
      pubYear: f.pubYear ? String(f.pubYear) : "",
      doi: f.doi,
      issueNo: String(article.issueNo),
      issueSeq: article.issueSeq ? String(article.issueSeq) : "",
    };
    const [editable, view] = await Promise.all([getEditableProfile(user.id), loadArticleView(article.id, false)]);
    return (
      <DashboardShell admin={admin} moderator={user.role === "moderator"} wide>
        <div className="mx-auto max-w-[100rem]">
          <ArticleEditor
            header={
              <>
                <Link href="/dashboard" className="link text-sm">
                  ← Kabinet
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {/* Hali sarlavhasi yo‘q maqola — "Yangi maqola": raqam o‘qituvchini chalg‘itmasin */}
                  <h1 className="font-serif text-3xl font-semibold tracking-tight">
                    {article.titleUz || article.titleRu || article.titleEn ? `Maqola №${article.id}` : "Yangi maqola"}
                  </h1>
                  <StatusChip status={article.status} />
                </div>
              </>
            }
            id={article.id}
            initial={initial}
            initialAuthors={f.authors}
            initialPdfBytes={article.pdfKey ? article.pdfBytes : null}
            reviewNote={article.status === "rejected" ? article.reviewNote : null}
            hasProfile={Boolean(editable?.profile)}
            canDelete={article.publishedAt === null}
            ai={aiClient() !== null}
            preview={{
              owner: view!.owner,
              others: view!.others,
              updatedAt: article.updatedAt.toISOString(),
              absoluteUrl: articleUrl(article.id),
            }}
          />
        </div>
      </DashboardShell>
    );
  }

  // Yuborilgan maqola oldindan ko‘rish bilan, chop etilgani ommaviy sahifaga havola bilan (tahrirlab bo‘lmaydi)
  const published = article.status === "published";
  const view = published ? null : await loadArticleView(article.id, false);
  // Zenodo sozlangan bo‘lsa — chop etilgan maqola uchun joylash paneli
  const zenodo = published ? zenodoConfig() : null;
  const panel = zenodo ? await loadZenodoPanel(zenodo, own) : null;
  const flash = panel ? zenodoFlash((await searchParams).zenodo) : null;
  return (
    <DashboardShell admin={admin} moderator={user.role === "moderator"}>
      <Link href="/dashboard" className="link text-sm">
        ← Kabinet
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper p-4">
        <StatusChip status={article.status} />
        <p className="min-w-0 flex-1 text-sm">
          {published
            ? `Chop etilgan: ${formatDate(article.publishedAt!)}. O‘zgartirish kerak bo‘lsa, universitet administratoriga murojaat qiling.`
            : `Yuborilgan: ${formatDate(article.submittedAt!)}. Universitet tasdiqlagach sahifa ochiladi, natijani Telegram orqali xabar qilamiz.`}
        </p>
        {published && (
          <a href={`/maqola/${article.id}`} className="btn btn-secondary">
            Ommaviy sahifa
          </a>
        )}
      </div>
      {zenodo && panel && <ZenodoPanel id={article.id} sandbox={zenodo.sandbox} flash={flash} panel={panel} />}
      {view ? (
        <div className="mt-8">
          <ArticleView v={view} absoluteUrl={articleUrl(article.id)} preview />
        </div>
      ) : (
        <h1 className="mt-8 max-w-3xl font-serif text-2xl font-semibold">{titleIn(article)}</h1>
      )}
    </DashboardShell>
  );
}
