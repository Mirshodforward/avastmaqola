import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AdminShell, Stats } from "@/components/admin/admin-shell";
import { BarChart } from "@/components/admin/bar-chart";
import { formatNumber, formatShare, formatUsd, monthLabel } from "@/components/admin/format";
import { ReviewDrawer } from "@/components/admin/review-drawer";
import { ReviewList } from "@/components/admin/review-list";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { ARTICLE_STATUSES, STATUS_LABELS } from "@/lib/article-rules";
import { getOverview } from "@/server/admin/overview";
import { textParam } from "@/server/admin/params";
import { listReviewQueue } from "@/server/articles/review";
import { requireAdminPage } from "@/server/auth/session";
import { listPendingRatings } from "@/server/ratings/service";

type Props = PageProps<"/admin">;

export const metadata: Metadata = { title: "Admin panel", robots: { index: false } };

export default function AdminOverviewPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

/** Umumiy sahifa: avval asosiy ish (navbat), keyin ko‘rsatkichlar qatori, grafiklar, kirish va AI */
async function Overview({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdminPage();
  const [params, { people, profiles, articles, sessions, auth, ai, months }, queue, ratings] = await Promise.all([
    searchParams,
    getOverview(),
    listReviewQueue(),
    listPendingRatings(),
  ]);
  const total = (key: "submitted" | "published" | "users") => months.reduce((sum, m) => sum + m[key], 0);
  const point = (m: (typeof months)[number], values: number[]) => ({
    key: m.month,
    label: monthLabel(m.month),
    title: monthLabel(m.month, true),
    values,
  });

  return (
    <AdminShell current="overview" title="Umumiy ko‘rsatkichlar">
      <Section
        id="queue-title"
        title="Ko‘rib chiqish navbati"
        count={queue.length}
        action={
          queue.length > 0 && (
            <Link href="/admin/queue" className="link text-sm">
              Butun navbat
            </Link>
          )
        }
        className="mt-8"
      >
        {queue.length ? (
          <ReviewList items={queue.slice(0, 5)} href={(id) => `/admin?view=${id}`} className="mt-4" />
        ) : (
          <p className="mt-3 text-muted">Navbat bo‘sh.</p>
        )}
      </Section>

      <Stats
        className="mt-12"
        items={[
          {
            label: "Shu oy chop etilgan",
            value: formatNumber(articles.publishedThisMonth),
            detail: `saytda jami ${formatNumber(articles.published)}`,
          },
          {
            label: "O‘qituvchilar",
            href: "/admin/teachers",
            value: formatNumber(people.total),
            detail: `+${formatNumber(people.new30)}, 30 kunda${people.admins ? ` · ${formatNumber(people.admins)} admin` : ""}`,
          },
          {
            label: "Profil to‘ldirgan",
            value: formatNumber(profiles.filled),
            detail: `${formatShare(profiles.filled, people.total)} · ochiq ${formatNumber(profiles.open)}`,
          },
          { label: "Iqtiboslar kutmoqda", href: "/admin/iqtiboslar", value: formatNumber(ratings.length) },
        ]}
      />

      <div className="mt-12 grid gap-x-12 gap-y-12 lg:grid-cols-2">
        <Section id="articles-title" title="Maqolalar">
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {ARTICLE_STATUSES.map((s) => {
              const label = (
                <>
                  <span className="text-muted group-hover:text-lapis">{STATUS_LABELS[s]}</span>{" "}
                  <span className="font-semibold tabular-nums group-hover:text-lapis">{formatNumber(articles[s])}</span>
                </>
              );
              // Qoralama faqat muallifniki: adminda ro‘yxati yo‘q, faqat soni
              return (
                <li key={s}>
                  {s === "draft" ? (
                    label
                  ) : (
                    <Link href={`/admin/articles?status=${s}`} className="group">
                      {label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <BarChart
            series={["Yuborilgan", "Chop etilgan"]}
            totals={[total("submitted"), total("published")]}
            points={months.map((m) => point(m, [m.submitted, m.published]))}
            tableLabel="Maqolalar oylar bo‘yicha"
          />
        </Section>

        <Section id="signups-title" title="Yangi o‘qituvchilar">
          <BarChart
            series={["Ro‘yxatdan o‘tganlar"]}
            totals={[total("users")]}
            points={months.map((m) => point(m, [m.users]))}
            tableLabel="Yangi o‘qituvchilar oylar bo‘yicha"
          />
        </Section>
      </div>

      <Section id="system-title" title="Kirish va AI" className="mt-12">
        <Stats
          size="sm"
          className="mt-4"
          items={[
            {
              label: "Faol sessiyalar",
              value: formatNumber(sessions.active),
              detail: `${formatNumber(sessions.people)} foydalanuvchi`,
            },
            {
              label: "Kirish va ro‘yxatdan o‘tish, 7 kun",
              value: formatNumber(auth.total),
              detail: `${formatNumber(auth.verified)} muvaffaqiyatli · ${formatNumber(auth.failed)} muvaffaqiyatsiz · ${formatNumber(auth.abandoned)} muddati o‘tgan`,
            },
            {
              label: "AI so‘rovlar, bugun",
              href: "/admin/ai",
              value: formatNumber(ai.today),
              detail: `30 kunda ${formatNumber(ai.month)} · xato ${formatShare(ai.errors, ai.month)}`,
            },
            {
              label: "AI xarajati, 30 kun",
              value: formatUsd(ai.costMicroUsd),
              detail: `taxminiy · ${formatNumber(ai.tokens)} token`,
            },
          ]}
        />
      </Section>

      <ReviewDrawer view={textParam(params, "view") || null} closeHref="/admin" />
    </AdminShell>
  );
}

/** Bo‘lim: serif sarlavha, yonida ixtiyoriy son (kulrang) va o‘ngda havola */
function Section({
  id,
  title,
  count,
  action,
  className = "",
  children,
}: {
  id: string;
  title: string;
  count?: number;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`min-w-0 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id={id} className="font-serif text-xl font-semibold">
          {title}
          {count !== undefined && count > 0 && <span className="ml-2 tabular-nums text-muted">{formatNumber(count)}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
