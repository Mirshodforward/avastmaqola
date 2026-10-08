import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleEditor, type EditorValues } from "@/components/article/article-editor";
import { ArticleView } from "@/components/article/article-view";
import { StatusChip } from "@/components/article/status-chip";
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

type Props = PageProps<"/dashboard/articles/[id]">;

export const metadata: Metadata = { title: "Maqola" };

export default function ArticleEditPage({ params }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ArticleWorkspace params={params} />
    </Suspense>
  );
}

async function ArticleWorkspace({ params }: Pick<Props, "params">) {
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
      rightsConfirmed: f.rightsConfirmed,
      titleUz: f.titleUz,
      titleRu: f.titleRu,
      titleEn: f.titleEn,
      abstractUz: f.abstractUz,
      abstractRu: f.abstractRu,
      abstractEn: f.abstractEn,
      keywordsUz: f.keywordsUz.join(", "),
      keywordsRu: f.keywordsRu.join(", "),
      keywordsEn: f.keywordsEn.join(", "),
    };
    const [editable, view] = await Promise.all([getEditableProfile(user.id), loadArticleView(article.id, false)]);
    return (
      <DashboardShell admin={admin} wide>
        <div className="mx-auto max-w-[96rem]">
          <Link href="/dashboard" className="link text-sm">
            ← Kabinet
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl font-semibold tracking-tight">Maqola №{article.id}</h1>
            <StatusChip status={article.status} />
          </div>
          <p className="mt-2 max-w-2xl text-muted">
            Qoralama faqat sizga ko‘rinadi. Yulduzcha (*) bilan belgilangan maydonlar yuborish uchun majburiy.
          </p>
          <ArticleEditor
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
  return (
    <DashboardShell admin={admin}>
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
