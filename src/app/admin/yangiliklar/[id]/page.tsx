import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { NewsForm } from "@/components/news/news-form";
import { newsImageUrl } from "@/lib/media";
import { requireAdminPage } from "@/server/auth/session";
import { parseNewsId } from "@/server/news/schemas";
import { getNews } from "@/server/news/service";

type Props = PageProps<"/admin/yangiliklar/[id]">;

export const metadata: Metadata = { title: "Admin: yangilik", robots: { index: false } };

export default function AdminNewsEditPage({ params }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<Props, "params">) {
  await requireAdminPage();
  const id = parseNewsId((await params).id);
  const item = id ? await getNews(id) : null;
  if (!item) notFound();

  return (
    <AdminShell current="news" title="Yangilikni tahrirlash">
      <NewsForm
        key={item.id}
        id={item.id}
        initial={{ title: item.title, body: item.body }}
        initialPublished={item.publishedAt !== null}
        initialImageUrl={item.imageKey ? newsImageUrl(item.imageKey) : null}
      />
    </AdminShell>
  );
}
