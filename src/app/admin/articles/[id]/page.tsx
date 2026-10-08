import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ArticleView } from "@/components/article/article-view";
import { ReviewPanel } from "@/components/article/review-panel";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard/shell";
import { ARTICLE_LIMITS } from "@/lib/article-rules";
import { formatBytes } from "@/lib/format";
import { parseArticleId } from "@/server/articles/schemas";
import { articleUrl } from "@/server/articles/seo";
import { loadArticleView } from "@/server/articles/view";
import { requireAdminPage } from "@/server/auth/session";

type Props = PageProps<"/admin/articles/[id]">;

export const metadata: Metadata = { title: "Maqolani ko‘rib chiqish", robots: { index: false } };

export default function AdminArticlePage({ params }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Review params={params} />
    </Suspense>
  );
}

async function Review({ params }: Pick<Props, "params">) {
  await requireAdminPage();
  const id = parseArticleId((await params).id);
  // Keshsiz o‘qiladi: admin hali chop etilmagan maqolani ommaviy sahifa ko‘rinishida ko‘radi.
  // Hech qachon yuborilmagan qoralama faqat muallifniki ("Qoralama faqat sizga ko‘rinadi")
  const v = id ? await loadArticleView(id, false) : null;
  if (!v || v.status === "draft") notFound();

  return (
    <DashboardShell admin>
      <AdminNav />
      <Link href="/admin/queue" className="link mt-6 inline-block text-sm">
        ← Navbat
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* min-w-0: maqola (mx-auto) telefonda uzun BibTeX qatori bilan sahifadan kengayib ketmasin */}
        <div className="min-w-0">
          <ArticleView v={v} absoluteUrl={articleUrl(v.id)} preview={v.status !== "published"} />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {v.pdfBytes !== null && v.pdfBytes > ARTICLE_LIMITS.pdfScholarBytes && (
            <p className="rounded-xl border border-line bg-paper p-4 text-sm text-muted">
              PDF {formatBytes(v.pdfBytes)}: 5 MB dan katta faylni Google Scholar o‘qimasligi mumkin. O‘qituvchidan
              siqilgan nusxa so‘rash mumkin.
            </p>
          )}
          <ReviewPanel
            id={v.id}
            status={v.status}
            submittedAt={v.submittedAt ? new Date(v.submittedAt).toISOString() : null}
          />
        </aside>
      </div>
    </DashboardShell>
  );
}
