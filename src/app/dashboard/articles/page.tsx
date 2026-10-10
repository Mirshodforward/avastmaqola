import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewArticleButton } from "@/components/article/new-article-button";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard/shell";
import { OwnArticleList } from "@/components/dashboard/own-articles";
import { ARTICLE_STATUSES, STATUS_LABELS, type ArticleStatus } from "@/lib/article-rules";
import { listOwnArticles } from "@/server/articles/service";
import { requireUser } from "@/server/auth/session";

type Props = PageProps<"/dashboard/articles">;

export const metadata: Metadata = { title: "Maqolalarim" };

export default function MyArticlesPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MyArticles searchParams={searchParams} />
    </Suspense>
  );
}

async function MyArticles({ searchParams }: Pick<Props, "searchParams">) {
  const user = await requireUser();
  const raw = (await searchParams).status;
  const status = ARTICLE_STATUSES.find((s) => s === raw) ?? null;
  const all = await listOwnArticles(user.id);
  const count = (s: ArticleStatus) => all.filter((a) => a.status === s).length;
  const shown = status ? all.filter((a) => a.status === status) : all;
  // Maqolasi yo‘q holatlar filtrda ko‘rinmaydi (URL’da tanlangani bundan mustasno)
  const tabs = [
    { status: null, label: "Hammasi", count: all.length },
    ...ARTICLE_STATUSES.filter((s) => count(s) > 0 || s === status).map((s) => ({
      status: s,
      label: STATUS_LABELS[s],
      count: count(s),
    })),
  ];

  return (
    <DashboardShell admin={user.role === "admin"} moderator={user.role === "moderator"}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Maqolalarim</h1>
        <NewArticleButton />
      </div>

      {all.length === 0 ? (
        <p className="mt-8 text-muted">Hali maqola yo‘q.</p>
      ) : (
        <>
          {/* aria-current="true": header’dagi «Maqolalarim» allaqachon "page" */}
          <nav aria-label="Holat bo‘yicha" className="mt-8 flex flex-wrap gap-2">
            {tabs.map((t) => {
              const active = status === t.status;
              return (
                <Link
                  key={t.label}
                  href={t.status ? `/dashboard/articles?status=${t.status}` : "/dashboard/articles"}
                  aria-current={active ? "true" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                    active ? "border-lapis bg-lapis text-on-lapis" : "border-line bg-paper hover:border-lapis"
                  }`}
                >
                  {t.label}
                  <span className={`tabular-nums ${active ? "" : "text-muted"}`}>{t.count}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-6">
            {shown.length > 0 ? <OwnArticleList articles={shown} /> : <p className="text-muted">Bu holatda maqola yo‘q.</p>}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
