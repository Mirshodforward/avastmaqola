import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
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
    <AdminShell current="news" title="Yangiliklar">
      <div className="mt-6">
        <NewNewsButton />
      </div>
      {items.length === 0 ? (
        <p className="mt-6 text-muted">Hali yangilik yo‘q.</p>
      ) : (
        <ul className="mt-6 max-w-3xl divide-y divide-line rounded-xl border border-line bg-paper">
          {items.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <Link href={`/admin/yangiliklar/${n.id}`} className="font-medium hover:text-lapis">
                  {n.title || "Sarlavhasiz"}
                </Link>
                <p className="mt-0.5 text-sm text-muted">
                  {n.publishedAt ? `Chop etilgan: ${formatDate(n.publishedAt)}` : `O‘zgartirilgan: ${formatDate(n.updatedAt)}`}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${
                  n.publishedAt ? "bg-tile-soft text-tile" : "border border-line text-muted"
                }`}
              >
                {n.publishedAt ? "Chop etilgan" : "Qoralama"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
