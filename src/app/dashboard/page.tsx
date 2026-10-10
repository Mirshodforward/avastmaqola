import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewArticleButton } from "@/components/article/new-article-button";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard/shell";
import { OwnArticleList } from "@/components/dashboard/own-articles";
import { PresenceTile } from "@/components/web-presence/presence-tile";
import { ARTICLE_STATUSES, STATUS_LABELS, type ArticleStatus } from "@/lib/article-rules";
import { listOwnArticles } from "@/server/articles/service";
import { requireUser } from "@/server/auth/session";
import { getEditableProfile } from "@/server/profiles/service";

export const metadata: Metadata = { title: "Kabinet" };

/** Kabinetda ko‘rinadigan so‘nggi maqolalar soni — qolgani «Maqolalarim» sahifasida */
const RECENT = 3;

export default function DashboardPage() {
  // Sessiya so‘rov vaqtida o‘qiladi, shuning uchun kabinet Suspense ichida oqim bilan keladi
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const [editable, articles] = await Promise.all([getEditableProfile(user.id), listOwnArticles(user.id)]);
  const count = (s: ArticleStatus) => articles.filter((a) => a.status === s).length;
  // «2 chop etilgan · 7 qoralama» — faqat bor holatlar
  const summary = ARTICLE_STATUSES.filter((s) => count(s) > 0)
    .map((s) => `${count(s)} ${STATUS_LABELS[s].toLowerCase()}`)
    .join(" · ");

  return (
    <DashboardShell admin={user.role === "admin"} moderator={user.role === "moderator"}>
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Xush kelibsiz, {user.firstName}!</h1>
      {!editable?.profile && (
        <p className="mt-3 text-muted">
          Maqola yuborish uchun avval profilni to‘ldiring.{" "}
          <Link href="/dashboard/profile" className="link font-medium">
            Profilni to‘ldirish
          </Link>
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NewArticleButton variant="tile" />
        <Link
          href="/dashboard/articles"
          className="flex min-h-28 flex-col justify-center rounded-xl border border-line bg-paper px-6 py-5 transition-colors hover:border-lapis"
        >
          <span className="flex items-baseline justify-between gap-4">
            <span className="font-serif text-xl font-semibold">Maqolalarim</span>
            <span className="font-serif text-xl font-semibold tabular-nums text-muted">{articles.length}</span>
          </span>
          <span className="mt-1 text-sm text-muted">{summary || "Hali maqola yo‘q"}</span>
        </Link>
        <PresenceTile userId={user.id} />
      </div>

      {articles.length > 0 && (
        <section aria-labelledby="recent-title" className="mt-12">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="recent-title" className="font-serif text-xl font-semibold">
              So‘nggi maqolalar
            </h2>
            <Link href="/dashboard/articles" className="link text-sm">
              Hammasini ko‘rish
            </Link>
          </div>
          <OwnArticleList articles={articles.slice(0, RECENT)} />
        </section>
      )}
    </DashboardShell>
  );
}
