import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatDateTime, formatNumber } from "@/components/admin/format";
import { Pagination, withParams } from "@/components/admin/pagination";
import { Count, TableFrame, numeric, td, th } from "@/components/admin/table";
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
    <AdminShell
      current="teachers"
      title="O‘qituvchilar"
      lead="Ro‘yxatdan o‘tgan barcha foydalanuvchilar (adminlar ham), yangilari birinchi."
    >
      <SearchForm filters={filters} />

      <p className="mt-6 text-sm text-muted">
        {filters.q ? "Topildi" : "Jami"}: {formatNumber(total)} kishi
      </p>
      {items.length ? (
        <TableFrame label="O‘qituvchilar ro‘yxati" minWidth="min-w-[68rem]">
          <thead>
            <tr>
              <th scope="col" rowSpan={2} className={th}>
                Ism
              </th>
              <th scope="col" rowSpan={2} className={th}>
                Telefon
              </th>
              <th scope="col" rowSpan={2} className={th}>
                Ro‘yxatdan o‘tgan
              </th>
              <th scope="col" rowSpan={2} className={th}>
                Profil
              </th>
              <th scope="colgroup" colSpan={4} className={`${th} text-center`}>
                Maqolalar
              </th>
              <th scope="col" rowSpan={2} className={`${th} ${numeric}`}>
                AI, 30 kun
              </th>
              <th scope="col" rowSpan={2} className={th}>
                Oxirgi kirish
              </th>
            </tr>
            <tr>
              {ARTICLE_STATUSES.map((s) => (
                <th key={s} scope="col" className={`${th} ${numeric}`}>
                  {STATUS_LABELS[s]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td className={`${td} whitespace-nowrap font-medium`}>
                  {u.firstName} {u.lastName}
                  {u.role === "admin" && (
                    <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-xs font-normal text-muted">
                      admin
                    </span>
                  )}
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
        <p className="mt-4 rounded-xl border border-line bg-paper p-5 text-muted">
          {filters.q ? "Bu so‘rovga mos o‘qituvchi topilmadi." : "Hali ro‘yxatdan o‘tganlar yo‘q."}
        </p>
      )}
      <Pagination page={page} pages={pages} href={href} />
    </AdminShell>
  );
}

function SearchForm({ filters }: { filters: TeacherFilters }) {
  return (
    // key: "Tozalash"dan keyin maydon URL’dagi bo‘sh qiymat bilan qayta chiziladi
    <Form
      key={filters.q}
      action="/admin/teachers"
      role="search"
      aria-label="O‘qituvchilarni qidirish"
      className="mt-6 flex flex-wrap items-end gap-3"
    >
      <label className="grid w-full gap-1.5 text-sm font-medium sm:w-80">
        Qidirish
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          maxLength={100}
          placeholder="Ism, familiya yoki telefon"
          className="input font-normal"
        />
      </label>
      <button type="submit" className="btn btn-primary py-3">
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
