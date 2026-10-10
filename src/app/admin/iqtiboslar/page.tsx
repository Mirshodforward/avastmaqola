import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Chip, type ChipTone } from "@/components/article/status-chip";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { RatingDecision } from "@/components/rating/rating-decision";
import { Stars } from "@/components/rating/stars";
import { T } from "@/components/rating/text";
import { formatDate } from "@/lib/format";
import type { RatingStatus } from "@/lib/rating-rules";
import { requireAdminPage } from "@/server/auth/session";
import { listPendingRatings, listRecentRatingDecisions } from "@/server/ratings/service";

export const metadata: Metadata = { title: "Iqtiboslar", robots: { index: false } };

export default function AdminRatingsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Ratings />
    </Suspense>
  );
}

type Item = Awaited<ReturnType<typeof listPendingRatings>>[number];

async function Ratings() {
  await requireAdminPage();
  const [pending, recent] = await Promise.all([listPendingRatings(), listRecentRatingDecisions()]);

  return (
    <AdminShell current="ratings" title={T.admin.title}>
      {pending.length ? <Items items={pending} /> : <p className="mt-6 text-muted">{T.admin.empty}</p>}

      {recent.length > 0 && (
        <section aria-labelledby="recent-title" className="mt-12">
          <h2 id="recent-title" className="font-serif text-xl font-semibold">
            {T.admin.recent}
          </h2>
          <Items items={recent} />
        </section>
      )}
    </AdminShell>
  );
}

const TONE: Record<RatingStatus, ChipTone> = { pending: "lapis", approved: "tile", rejected: "danger" };

function Items({ items }: { items: Item[] }) {
  return (
    <ul className="mt-4 divide-y divide-line border-y border-line">
      {items.map((r) => (
        <li key={r.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars value={r.stars} tone="paper" label={T.form.star(r.stars)} className="text-lg" />
              <span className="text-sm text-muted">{T.admin.meta(r.name, formatDate(r.updatedAt))}</span>
              {r.status !== "pending" && <Chip tone={TONE[r.status]}>{T.admin.status[r.status]}</Chip>}
            </div>
            <p className="mt-2 whitespace-pre-line break-words leading-relaxed">{r.body}</p>
            <p className="mt-2 text-sm">
              <Link href={`/maqola/${r.articleId}`} className="link" target="_blank">
                №{r.articleId}. {r.title}
              </Link>
            </p>
          </div>
          <RatingDecision id={r.id} status={r.status} updatedAt={new Date(r.updatedAt).toISOString()} />
        </li>
      ))}
    </ul>
  );
}
