import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatDateTime, formatNumber } from "@/components/admin/format";
import { Pagination, withParams } from "@/components/admin/pagination";
import { Count, TableFrame, numeric, td, th, thWrap } from "@/components/admin/table";
import { Chip } from "@/components/article/status-chip";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { ARTICLE_STATUSES, STATUS_LABELS } from "@/lib/article-rules";
import { formatDate } from "@/lib/format";
import { formatUzPhone } from "@/lib/validation";
import { listTeachers, parseTeacherFilters, type TeacherFilters } from "@/server/admin/teachers";
import { requireAdminPage } from "@/server/auth/session";

type Props = PageProps<"/admin/teachers">;

export const metadata: Metadata = { title: "Admin: o‘qituvchilar", robots: { index: false } };

export default function AdminTeachersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Teachers searchParams={searchParams} />
    </Suspense>
  );
}

async function Teachers({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdminPage();
  const filters = parseTeacherFilters(await searchParams);
  const { items, total, page, pages } = await listTeachers(filters);
  const href = (p: number) => withParams("/admin/teachers", { q: filters.q, page: p > 1 ? p : null });

  return (
    <AdminShell current="teachers" title="O‘qituvchilar">
      <SearchForm filters={filters} />

      <p className="mt-6 text-sm text-muted">
        {filters.q ? "Topildi" : "Jami"}: {formatNumber(total)} kishi
      </p>
      {items.length ? (
        <TableFrame label="O‘qituvchilar ro‘yxati" minWidth="min-w-[56rem]">
          <thead>
            <tr>
              <th scope="col" rowSpan={2} className={th}>
                Ism
              </th>
              <th scope="col" rowSpan={2} className={th}>
                Telefon
              </th>
              <th scope="col" rowSpan={2} className={thWrap}>
                Ro‘yxatdan o‘tgan
              </th>
              <th scope="col" rowSpan={2} className={th}>
                Profil
              </th>
              <th scope="col" colSpan={4} className={`${th} text-center`}>
                Maqolalar
              </th>
              <th scope="col" rowSpan={2} className={`${thWrap} ${numeric}`}>
                AI, 30 kun
              </th>
              <th scope="col" rowSpan={2} className={thWrap}>
                Oxirgi kirish
              </th>
            </tr>
            <tr>
              {ARTICLE_STATUSES.map((s) => (
                <th key={s} scope="col" className={`${thWrap} ${numeric}`}>
                  {STATUS_LABELS[s]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                {/* Ism o‘raladi (boshqa ustunlar o‘ralmaydi): jadval 1440 da sahifa eniga sig‘adi */}
                <td className={`${td} font-medium`}>
                  {/* gap: belgi keyingi qatorga tushsa ham chap chetga tekis */}
                  <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                    {u.firstName} {u.lastName}
                    {u.role === "admin" && <Chip tone="neutral">admin</Chip>}
                  </span>
                </td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>{formatUzPhone(u.phone)}</td>
                <td className={`${td} whitespace-nowrap`}>{formatDate(u.createdAt)}</td>
                <td className={`${td} whitespace-nowrap`}>
                  {u.slug === null ? (
                    <span className="text-muted">To‘ldirilmagan</span>
                  ) : u.isPublic ? (
                    <Link href={`/oqituvchi/${u.slug}`} className="link">
                      Ochiq
                    </Link>
                  ) : (
                    "Yopiq"
                  )}
                </td>
                {ARTICLE_STATUSES.map((s) => (
                  <td key={s} className={`${td} ${numeric}`}>
                    <Count value={u[s]} />
                  </td>
                ))}
                <td className={`${td} ${numeric}`}>
                  <Count value={u.ai30} />
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  {u.lastLogin ? formatDateTime(u.lastLogin) : <span className="text-muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      ) : (
        <p className="mt-4 text-muted">
          {filters.q ? "Bu so‘rovga mos o‘qituvchi topilmadi." : "Hali ro‘yxatdan o‘tganlar yo‘q."}
        </p>
      )}
      <Pagination page={page} pages={pages} href={href} />
    </AdminShell>
  );
}

function SearchForm({ filters }: { filters: TeacherFilters }) {
  return (
    // key: "Tozalash"dan keyin maydon URL’dagi bo‘sh qiymat bilan qayta chiziladi.
    // «Maqolalar»dagi qidiruv bilan bir xil: yashirin yorliq, to‘q placeholder, tugma maydon balandligida
    <Form
      key={filters.q}
      action="/admin/teachers"
      role="search"
      aria-label="O‘qituvchilarni qidirish"
      className="mt-8 flex flex-wrap items-stretch gap-3"
    >
      <label className="sr-only" htmlFor="admin-teachers-q">
        Qidirish
      </label>
      <input
        id="admin-teachers-q"
        type="search"
        name="q"
        defaultValue={filters.q}
        maxLength={100}
        placeholder="Ism, familiya yoki telefon"
        className="input w-full placeholder:text-muted sm:w-[28rem]"
      />
      <button type="submit" className="btn btn-primary">
        Qidirish
      </button>
      {filters.q && (
        <Link href="/admin/teachers" className="btn btn-ghost">
          Tozalash
        </Link>
      )}
    </Form>
  );
}
