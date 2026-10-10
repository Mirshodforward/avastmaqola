import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewDrawer } from "@/components/admin/review-drawer";
import { ReviewList } from "@/components/admin/review-list";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard/shell";
import { textParam } from "@/server/admin/params";
import { listRecentlyReviewed, listReviewQueue } from "@/server/articles/review";
import { requireModeratorPage } from "@/server/auth/session";

type Props = PageProps<"/moderator">;

export const metadata: Metadata = { title: "Moderator", robots: { index: false } };

export default function ModeratorPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ReviewQueue searchParams={searchParams} />
    </Suspense>
  );
}

const view = (id: number) => `/moderator?view=${id}`;

/** Moderatorga faqat maqolalar: navbat va so‘nggi qarorlar. Statistika, o‘qituvchilar va AI so‘rovlar — faqat adminda */
async function ReviewQueue({ searchParams }: Pick<Props, "searchParams">) {
  await requireModeratorPage();
  const [params, queue, recent] = await Promise.all([searchParams, listReviewQueue(), listRecentlyReviewed()]);

  return (
    <DashboardShell moderator>
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Ko‘rib chiqish navbati</h1>
      {queue.length ? <ReviewList items={queue} href={view} className="mt-6" /> : <p className="mt-6 text-muted">Navbat bo‘sh.</p>}

      {recent.length > 0 && (
        <section aria-labelledby="recent-title" className="mt-12">
          <h2 id="recent-title" className="font-serif text-xl font-semibold">
            So‘nggi qarorlar
          </h2>
          <ReviewList items={recent} href={view} decided className="mt-4" />
        </section>
      )}
      <ReviewDrawer view={textParam(params, "view") || null} closeHref="/moderator" moderator />
    </DashboardShell>
  );
}
