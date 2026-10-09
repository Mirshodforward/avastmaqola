import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
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
      {pending.length ? (
        <Items items={pending} />
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-paper p-5 text-muted">{T.admin.empty}</p>
      )}

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

const CHIP: Record<RatingStatus, string> = {
  pending: "border-lapis/40 text-lapis",
  approved: "border-tile/40 text-tile",
  rejected: "border-danger/40 text-danger",
};

function Items({ items }: { items: Item[] }) {
  return (
    <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-paper">
      {items.map((r) => (
        <li key={r.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-6 sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars value={r.stars} tone="paper" label={T.form.star(r.stars)} className="text-lg" />
              <span className="text-sm text-muted">{T.admin.meta(r.name, formatDate(r.updatedAt))}</span>
              {r.status !== "pending" && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${CHIP[r.status]}`}>
                  {T.admin.status[r.status]}
                </span>
              )}
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
