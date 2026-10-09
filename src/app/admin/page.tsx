import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell, Panel, Stat } from "@/components/admin/admin-shell";
import { BarChart } from "@/components/admin/bar-chart";
import { formatNumber, formatShare, formatUsd, formatWait, monthLabel } from "@/components/admin/format";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { ARTICLE_STATUSES, STATUS_LABELS } from "@/lib/article-rules";
import { getOverview } from "@/server/admin/overview";
import { requireAdminPage } from "@/server/auth/session";

export const metadata: Metadata = { title: "Admin panel", robots: { index: false } };

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  await requireAdminPage();
  const { people, profiles, articles, sessions, auth, ai, months, queue } = await getOverview();
  const thisMonth = months[months.length - 1].month;
  const total = (key: "submitted" | "published" | "users") => formatNumber(months.reduce((sum, m) => sum + m[key], 0));
  const point = (m: (typeof months)[number], values: number[]) => ({
    key: m.month,
    label: monthLabel(m.month),
    title: monthLabel(m.month, true),
    values,
  });

  return (
    <AdminShell
      current="overview"
      title="Umumiy ko‘rsatkichlar"
      lead="Toshkent vaqti bilan. “7 kun” va “30 kun” — bugun bilan birga."
    >
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="O‘qituvchilar"
          href="/admin/teachers"
          value={formatNumber(people.total)}
          detail={`+${formatNumber(people.new30)} so‘nggi 30 kunda${people.admins ? ` · adminlar: ${formatNumber(people.admins)}` : ""}`}
        />
        <Stat
          label="Profil to‘ldirgan"
          value={formatNumber(profiles.filled)}
          detail={`${formatShare(profiles.filled, people.total)} · ochiq: ${formatNumber(profiles.open)}`}
        />
        <Stat
          label="Ko‘rib chiqish navbati"
          href="/admin/queue"
          value={formatNumber(articles.submitted)}
          detail={
            articles.oldestWaitHours === null
              ? "Navbat bo‘sh"
              : `Eng eskisi ${formatWait(articles.oldestWaitHours)} kutmoqda`
          }
        />
        <Stat
          label="Shu oy chop etilgan"
          value={formatNumber(articles.publishedThisMonth)}
          detail={`${monthLabel(thisMonth, true)} · hozir saytda: ${formatNumber(articles.published)}`}
        />
        <Stat
          label="Faol sessiyalar"
          value={formatNumber(sessions.active)}
          detail={`${formatNumber(sessions.people)} foydalanuvchi`}
        />
        <Stat
          label="Kirish va ro‘yxatdan o‘tish, 7 kun"
          value={formatNumber(auth.total)}
          detail={`${formatNumber(auth.verified)} muvaffaqiyatli · ${formatNumber(auth.failed)} muvaffaqiyatsiz · ${formatNumber(auth.abandoned)} muddati o‘tgan`}
        />
        <Stat
          label="AI so‘rovlar bugun"
          href="/admin/ai"
          value={formatNumber(ai.today)}
          detail={`30 kunda: ${formatNumber(ai.month)} · xato: ${formatShare(ai.errors, ai.month)}`}
        />
        <Stat
          label="AI xarajati, 30 kun"
          value={formatUsd(ai.costMicroUsd)}
          detail={`taxminiy · ${formatNumber(ai.tokens)} token`}
        />
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          id="articles-title"
          title="Maqolalar"
          note="Qoralamalar faqat muallifga ko‘rinadi — bu yerda faqat ularning soni."
        >
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ARTICLE_STATUSES.map((s) => (
              <div key={s} className="relative rounded-lg bg-mist px-4 py-3">
                <dt className="text-xs text-muted">
                  {s === "draft" ? (
                    STATUS_LABELS[s]
                  ) : (
                    <Link
                      href={`/admin/articles?status=${s}`}
                      className="after:absolute after:inset-0 after:rounded-lg hover:text-lapis"
                    >
                      {STATUS_LABELS[s]}
                    </Link>
                  )}
                </dt>
                <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">{formatNumber(articles[s])}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-8 font-medium">So‘nggi 12 oy</h3>
          <p className="mt-1 text-sm text-muted">
            Yuborilgan: {total("submitted")}, chop etilgan: {total("published")}. Qayta yuborilgan maqola oxirgi
            yuborilgan oyida sanaladi.
          </p>
          <BarChart
            series={["Yuborilgan", "Chop etilgan"]}
            points={months.map((m) => point(m, [m.submitted, m.published]))}
            tableLabel="Maqolalar oylar bo‘yicha"
          />
        </Panel>

        <div className="grid min-w-0 content-start gap-6">
          <Panel
            id="waiting-title"
            title="Navbatda kutayotganlar"
            note="Eng uzoq kutayotgan 5 ta maqola"
            action={
              <Link href="/admin/queue" className="link text-sm">
                Butun navbat
              </Link>
            }
          >
            {queue.length ? (
              <ol className="mt-3 divide-y divide-line">
                {queue.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/articles/${a.id}`} className="break-words font-medium hover:text-lapis">
                        №{a.id}. {a.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">{a.author}</p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-sm text-muted">{formatWait(a.waitedHours)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-muted">Navbat bo‘sh.</p>
            )}
          </Panel>

          <Panel id="signups-title" title="Yangi o‘qituvchilar" note={`So‘nggi 12 oyda: ${total("users")}`}>
            <BarChart
              series={["Ro‘yxatdan o‘tganlar"]}
              points={months.map((m) => point(m, [m.users]))}
              tableLabel="Yangi o‘qituvchilar oylar bo‘yicha"
            />
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
