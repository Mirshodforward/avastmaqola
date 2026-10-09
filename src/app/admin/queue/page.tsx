import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ReviewDrawer } from "@/components/admin/review-drawer";
import { StatusChip } from "@/components/article/status-chip";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { formatDate } from "@/lib/format";
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

type Item = Awaited<ReturnType<typeof listReviewQueue>>[number];

async function ReviewQueue({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdminPage();
  const [params, queue, recent] = await Promise.all([searchParams, listReviewQueue(), listRecentlyReviewed()]);

  return (
    <AdminShell
      current="queue"
      title="Ko‘rib chiqish navbati"
      lead="Eng oldin yuborilgan maqola birinchi turadi. «Ko‘rish» maqolani yon panelda ochadi: chop eting yoki izoh bilan bekor qiling."
    >
      {queue.length ? (
        <Items items={queue} date={(a) => `Yuborilgan: ${formatDate(a.submittedAt!)}`} />
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-paper p-5 text-muted">Navbat bo‘sh.</p>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="recent-title" className="mt-12">
          <h2 id="recent-title" className="font-serif text-xl font-semibold">
            So‘nggi qarorlar
          </h2>
          <Items items={recent} date={(a) => (a.reviewedAt ? `Qaror: ${formatDate(a.reviewedAt)}` : "")} />
        </section>
      )}
      <ReviewDrawer view={textParam(params, "view") || null} closeHref="/admin/queue" />
    </AdminShell>
  );
}

function Items({ items, date }: { items: Item[]; date: (a: Item) => string }) {
  return (
    <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-paper">
      {items.map((a) => (
        // Qatorning istalgan joyini bosish «Ko‘rish»ni ochadi (klaviaturada esa bitta tugma)
        <li key={a.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-2 p-4 hover:bg-mist/60 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="break-words text-base font-medium leading-snug">
              №{a.id}. {a.title}
            </p>
            <p className="mt-1 text-sm text-muted">
              {a.author} · {date(a)}
            </p>
          </div>
          <StatusChip status={a.status} />
          <Link
            href={`/admin/queue?view=${a.id}`}
            scroll={false}
            aria-label={`Ko‘rish: №${a.id}. ${a.title}`}
            className="btn btn-secondary after:absolute after:inset-0"
          >
            Ko‘rish
          </Link>
        </li>
      ))}
    </ul>
  );
}
