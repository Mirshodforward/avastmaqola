import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ReviewDrawer } from "@/components/admin/review-drawer";
import { ReviewList } from "@/components/admin/review-list";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { textParam } from "@/server/admin/params";
import { listRecentlyReviewed, listReviewQueue } from "@/server/articles/review";
import { requireAdminPage } from "@/server/auth/session";

type Props = PageProps<"/admin/queue">;

export const metadata: Metadata = { title: "Ko‘rib chiqish", robots: { index: false } };

export default function AdminQueuePage({ searchParams }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ReviewQueue searchParams={searchParams} />
    </Suspense>
  );
}

const view = (id: number) => `/admin/queue?view=${id}`;

async function ReviewQueue({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdminPage();
  const [params, queue, recent] = await Promise.all([searchParams, listReviewQueue(), listRecentlyReviewed()]);

  return (
    <AdminShell current="queue" title="Ko‘rib chiqish navbati">
      {queue.length ? <ReviewList items={queue} href={view} className="mt-6" /> : <p className="mt-6 text-muted">Navbat bo‘sh.</p>}

      {recent.length > 0 && (
        <section aria-labelledby="recent-title" className="mt-12">
          <h2 id="recent-title" className="font-serif text-xl font-semibold">
            So‘nggi qarorlar
          </h2>
          <ReviewList items={recent} href={view} decided className="mt-4" />
        </section>
      )}
      <ReviewDrawer view={textParam(params, "view") || null} closeHref="/admin/queue" />
    </AdminShell>
  );
}
