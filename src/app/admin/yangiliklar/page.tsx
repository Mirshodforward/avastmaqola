import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Chip } from "@/components/article/status-chip";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { NewNewsButton } from "@/components/news/new-news-button";
import { formatDate } from "@/lib/format";
import { requireAdminPage } from "@/server/auth/session";
import { listAllNews } from "@/server/news/service";

export const metadata: Metadata = { title: "Admin: yangiliklar", robots: { index: false } };

export default function AdminNewsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <NewsList />
    </Suspense>
  );
}

async function NewsList() {
  await requireAdminPage();
  const items = await listAllNews();

  return (
    <AdminShell current="news" title="Yangiliklar" action={<NewNewsButton />}>
      {items.length === 0 ? (
        <p className="mt-6 text-muted">Hali yangilik yo‘q.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {items.map((n) => (
            // Ko‘rib chiqish ro‘yxati bilan bir xil qator: keng ekranda holat o‘ngda, telefonda sana yonida
            <li key={n.id} className="relative grid grid-cols-1 gap-x-6 gap-y-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline">
              <Link
                href={`/admin/yangiliklar/${n.id}`}
                className="break-words font-medium leading-snug after:absolute after:inset-0 hover:text-lapis"
              >
                {n.title || "Sarlavhasiz"}
              </Link>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted sm:contents">
                <p className="sm:col-start-1">
                  {n.publishedAt ? `Chop etilgan: ${formatDate(n.publishedAt)}` : `O‘zgartirilgan: ${formatDate(n.updatedAt)}`}
                </p>
                <span className="sm:col-start-2 sm:row-start-1 sm:justify-self-end">
                  <Chip tone={n.publishedAt ? "tile" : "neutral"}>{n.publishedAt ? "Chop etilgan" : "Qoralama"}</Chip>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
