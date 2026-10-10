import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatNumber } from "@/components/admin/format";
import { Pagination, withParams } from "@/components/admin/pagination";
import { ReviewDrawer } from "@/components/admin/review-drawer";
import { TableFrame, td, th } from "@/components/admin/table";
import { StatusChip } from "@/components/article/status-chip";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { STATUS_LABELS } from "@/lib/article-rules";
import { formatDate } from "@/lib/format";
import { LISTED_STATUSES, listArticles, parseArticleFilters } from "@/server/admin/articles";
import { textParam } from "@/server/admin/params";
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

// Keng ekranda (lg) holat va sanalar alohida ustunlarda; torroqda — sarlavha ostida, jadval sahifaga sig‘adi
const wide = "max-lg:hidden";

async function Articles({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdminPage();
  const params = await searchParams;
  const filters = parseArticleFilters(params);
  const { items, total, counts, page, pages } = await listArticles(filters);
  // Joriy ro‘yxat manzili: panel ochilsa ham, yopilsa ham filtr va sahifa saqlanadi
  const listHref = (extra: Record<string, string | number | null> = {}) =>
    withParams("/admin/articles", { status: filters.status, q: filters.q, page: page > 1 ? page : null, ...extra });
  const tabs = [
    { status: null, label: "Hammasi", count: counts.submitted + counts.published + counts.rejected },
    ...LISTED_STATUSES.map((s) => ({ status: s, label: STATUS_LABELS[s], count: counts[s] })),
  ];

  return (
    <AdminShell current="articles" title="Maqolalar">
      {/* Kabinetdagi «Maqolalarim» filtri bilan bir xil ko‘rinish */}
      <nav aria-label="Holat bo‘yicha" className="mt-8 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = filters.status === t.status;
          return (
            <Link
              key={t.label}
              href={withParams("/admin/articles", { status: t.status, q: filters.q })}
              aria-current={active ? "true" : undefined}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                active ? "border-lapis bg-lapis text-on-lapis" : "border-line bg-paper hover:border-lapis"
              }`}
            >
              {t.label}
              <span className={`tabular-nums ${active ? "" : "text-muted"}`}>{formatNumber(t.count)}</span>
            </Link>
          );
        })}
      </nav>

      {/* key: filtr o‘zgarganda (masalan, "Tozalash") maydon URL’dagi qiymat bilan qayta chiziladi.
          items-stretch: tugma maydon balandligida */}
      <Form
        key={`${filters.status}|${filters.q}`}
        action="/admin/articles"
        role="search"
        aria-label="Maqolalarni qidirish"
        className="mt-5 flex flex-wrap items-stretch gap-3"
      >
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <label className="sr-only" htmlFor="admin-articles-q">
          Qidirish
        </label>
        <input
          id="admin-articles-q"
          type="search"
          name="q"
          defaultValue={filters.q}
          maxLength={100}
          placeholder="Sarlavha, muallif yoki №"
          className="input w-full placeholder:text-muted sm:w-[28rem]"
        />
        <button type="submit" className="btn btn-primary">
          Qidirish
        </button>
        {filters.q && (
          <Link href={withParams("/admin/articles", { status: filters.status })} className="btn btn-ghost">
            Tozalash
          </Link>
        )}
      </Form>

      {filters.q && <p className="mt-6 text-sm text-muted">Topildi: {formatNumber(total)} ta maqola</p>}
      {items.length ? (
        <TableFrame label="Maqolalar ro‘yxati" minWidth="min-w-0">
          <thead>
            <tr>
              <th scope="col" className={th}>
                №
              </th>
              <th scope="col" className={th}>
                Maqola
              </th>
              <th scope="col" className={`${th} ${wide}`}>
                Holat
              </th>
              <th scope="col" className={`${th} ${wide}`}>
                Yuborilgan
              </th>
              <th scope="col" className={`${th} ${wide}`}>
                Chop etilgan
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              // Sarlavha — havola, butun qator bosiladi (panel ochiladi)
              <tr key={a.id} className="relative">
                <td className={`${td} tabular-nums text-muted`}>{a.id}</td>
                <td className={td}>
                  <Link
                    href={listHref({ view: a.id })}
                    scroll={false}
                    data-review-id={a.id}
                    className="text-base font-medium leading-snug after:absolute after:inset-0 hover:text-lapis"
                  >
                    {a.title}
                  </Link>
                  <p className="mt-0.5 text-muted">{a.author}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted lg:hidden">
                    <StatusChip status={a.status} />
                    {a.submittedAt && <span>Yuborilgan: {formatDate(a.submittedAt)}</span>}
                    {a.publishedAt && <span>Chop etilgan: {formatDate(a.publishedAt)}</span>}
                  </div>
                </td>
                <td className={`${td} ${wide}`}>
                  <StatusChip status={a.status} />
                </td>
                <td className={`${td} ${wide} whitespace-nowrap`}>{a.submittedAt ? formatDate(a.submittedAt) : "—"}</td>
                <td className={`${td} ${wide} whitespace-nowrap`}>{a.publishedAt ? formatDate(a.publishedAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      ) : (
        <p className="mt-6 text-muted">
          {filters.status || filters.q ? "Bu shartlarga mos maqola topilmadi." : "Hali ko‘rib chiqishga yuborilgan maqola yo‘q."}
        </p>
      )}
      <Pagination page={page} pages={pages} href={(p) => listHref({ page: p > 1 ? p : null })} />
      <ReviewDrawer view={textParam(params, "view") || null} closeHref={listHref()} />
    </AdminShell>
  );
}
