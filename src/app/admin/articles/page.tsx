import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatNumber } from "@/components/admin/format";
import { Pagination, withParams } from "@/components/admin/pagination";
import { TableFrame, td, th } from "@/components/admin/table";
import { StatusChip } from "@/components/article/status-chip";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { STATUS_LABELS } from "@/lib/article-rules";
import { formatDate } from "@/lib/format";
import { LISTED_STATUSES, listArticles, parseArticleFilters } from "@/server/admin/articles";
import { requireAdminPage } from "@/server/auth/session";

type Props = PageProps<"/admin/articles">;

export const metadata: Metadata = { title: "Admin: maqolalar", robots: { index: false } };

export default function AdminArticlesPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Articles searchParams={searchParams} />
    </Suspense>
  );
}

async function Articles({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdminPage();
  const filters = parseArticleFilters(await searchParams);
  const { items, total, counts, page, pages } = await listArticles(filters);
  const filtered = Boolean(filters.status || filters.q);
  const href = (p: number) =>
    withParams("/admin/articles", { status: filters.status, q: filters.q, page: p > 1 ? p : null });

  return (
    <AdminShell
      current="articles"
      title="Maqolalar"
      lead={`Ko‘rib chiqishga yuborilgan, chop etilgan va tuzatishga qaytarilgan maqolalar. Qoralamalar faqat muallifga ko‘rinadi (hozir ${formatNumber(counts.draft)} ta).`}
    >
      {/* key: filtr o‘zgarganda (masalan, "Tozalash") maydonlar URL’dagi qiymat bilan qayta chiziladi */}
      <Form
        key={`${filters.status}|${filters.q}`}
        action="/admin/articles"
        role="search"
        aria-label="Maqolalarni qidirish"
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <label className="grid w-full gap-1.5 text-sm font-medium sm:w-80">
          Qidirish
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            maxLength={100}
            placeholder="Sarlavha, muallif yoki №"
            className="input font-normal"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Holat
          <select name="status" defaultValue={filters.status ?? ""} className="input font-normal">
            <option value="">Hammasi ({formatNumber(counts.submitted + counts.published + counts.rejected)})</option>
            {LISTED_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]} ({formatNumber(counts[s])})
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary py-3">
          Ko‘rsatish
        </button>
        {filtered && (
          <Link href="/admin/articles" className="btn btn-ghost">
            Tozalash
          </Link>
        )}
      </Form>

      <p className="mt-6 text-sm text-muted">
        {filtered ? "Topildi" : "Jami"}: {formatNumber(total)} ta maqola
      </p>
      {items.length ? (
        <TableFrame label="Maqolalar ro‘yxati" minWidth="min-w-[52rem]">
          <thead>
            <tr>
              <th scope="col" className={th}>
                №
              </th>
              <th scope="col" className={th}>
                Sarlavha
              </th>
              <th scope="col" className={th}>
                Muallif
              </th>
              <th scope="col" className={th}>
                Holat
              </th>
              <th scope="col" className={th}>
                Yuborilgan
              </th>
              <th scope="col" className={th}>
                Chop etilgan
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td className={`${td} tabular-nums text-muted`}>{a.id}</td>
                <td className={`${td} min-w-72`}>
                  <Link href={`/admin/articles/${a.id}`} className="font-medium hover:text-lapis">
                    {a.title}
                  </Link>
                </td>
                <td className={`${td} whitespace-nowrap`}>{a.author}</td>
                <td className={td}>
                  <StatusChip status={a.status} />
                </td>
                <td className={`${td} whitespace-nowrap`}>{a.submittedAt ? formatDate(a.submittedAt) : "—"}</td>
                <td className={`${td} whitespace-nowrap`}>{a.publishedAt ? formatDate(a.publishedAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      ) : (
        <p className="mt-4 rounded-xl border border-line bg-paper p-5 text-muted">
          {filtered ? "Bu shartlarga mos maqola topilmadi." : "Hali ko‘rib chiqishga yuborilgan maqola yo‘q."}
        </p>
      )}
      <Pagination page={page} pages={pages} href={href} />
    </AdminShell>
  );
}
