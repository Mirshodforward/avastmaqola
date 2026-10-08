import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusChip } from "@/components/article/status-chip";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { formatDate } from "@/lib/format";
import { listRecentlyReviewed, listReviewQueue } from "@/server/articles/review";
import { requireAdminPage } from "@/server/auth/session";

export const metadata: Metadata = { title: "Ko‘rib chiqish", robots: { index: false } };

export default function AdminQueuePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ReviewQueue />
    </Suspense>
  );
}

type Item = Awaited<ReturnType<typeof listReviewQueue>>[number];

async function ReviewQueue() {
  await requireAdminPage();
  const [queue, recent] = await Promise.all([listReviewQueue(), listRecentlyReviewed()]);

  return (
    <AdminShell current="queue" title="Ko‘rib chiqish navbati" lead="Eng oldin yuborilgan maqola birinchi turadi.">
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
    </AdminShell>
  );
}

function Items({ items, date }: { items: Item[]; date: (a: Item) => string }) {
  return (
    <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-paper">
      {items.map((a) => (
        <li key={a.id} className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <Link href={`/admin/articles/${a.id}`} className="font-medium hover:text-lapis">
              №{a.id}. {a.title}
            </Link>
            <p className="mt-1 text-sm text-muted">
              {a.author} · {date(a)}
            </p>
          </div>
          <StatusChip status={a.status} />
        </li>
      ))}
    </ul>
  );
}
