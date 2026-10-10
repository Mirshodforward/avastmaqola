import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { BarChart } from "@/components/admin/bar-chart";
import {
  dayLabel,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatShare,
  formatUsd,
} from "@/components/admin/format";
import { Count, TableFrame, numeric, td, th } from "@/components/admin/table";
import { Chip, type ChipTone } from "@/components/article/status-chip";
import { DashboardSkeleton } from "@/components/dashboard/shell";
import { getAiUsage } from "@/server/admin/ai";
import { requireAdminPage } from "@/server/auth/session";
import type { AiRequestStatus } from "@/server/db/schema";

export const metadata: Metadata = { title: "Admin: AI so‘rovlar", robots: { index: false } };

// Umumiy to‘rt ohang: muvaffaqiyat — tile, xato va kesilgan javob (taklif qo‘llanmadi) — danger, jarayonda — lapis
const STATUS: Record<AiRequestStatus, { label: string; tone: ChipTone }> = {
  ok: { label: "Muvaffaqiyatli", tone: "tile" },
  error: { label: "Xato", tone: "danger" },
  refusal: { label: "Model rad etdi", tone: "neutral" },
  truncated: { label: "Javob kesildi", tone: "danger" },
  aborted: { label: "To‘xtatildi", tone: "neutral" },
  running: { label: "Jarayonda", tone: "lapis" },
};

type Usage = Awaited<ReturnType<typeof getAiUsage>>["totals"]["month"];

const TOTAL_ROWS: { label: string; value: (u: Usage) => string; sub?: boolean }[] = [
  { label: "So‘rovlar", value: (u) => formatNumber(u.requests) },
  ...(["ok", "error", "refusal", "truncated", "aborted", "running"] as const).map((s) => ({
    label: STATUS[s].label,
    value: (u: Usage) => formatNumber(u[s]),
    sub: true,
  })),
  { label: "Xato ulushi", value: (u) => formatShare(u.error, u.requests) },
  { label: "Kirish tokenlari", value: (u) => formatNumber(u.inputTokens) },
  { label: "Chiqish tokenlari", value: (u) => formatNumber(u.outputTokens) },
  { label: "Keshdan o‘qilgan", value: (u) => formatNumber(u.cacheReadTokens) },
  { label: "Keshga yozilgan", value: (u) => formatNumber(u.cacheWriteTokens) },
  { label: "Taxminiy narx", value: (u) => formatUsd(u.costMicroUsd, true) },
];

export default function AdminAiPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AiUsage />
    </Suspense>
  );
}

async function AiUsage() {
  await requireAdminPage();
  const { totals, daily, top, latest } = await getAiUsage();
  const windows = [
    { key: "today", label: "Bugun", usage: totals.today },
    { key: "week", label: "7 kun", usage: totals.week },
    { key: "month", label: "30 kun", usage: totals.month },
  ];

  return (
    <AdminShell current="ai" title="AI so‘rovlar">
      <div className="mt-8 grid gap-x-12 gap-y-12 xl:grid-cols-2">
        <Section id="totals-title" title="Jami">
          <TableFrame label="AI so‘rovlar: jami ko‘rsatkichlar" minWidth="min-w-[24rem]">
            <thead>
              <tr>
                <th scope="col" className={th}>
                  Ko‘rsatkich
                </th>
                {windows.map((w) => (
                  <th key={w.key} scope="col" className={`${th} ${numeric}`}>
                    {w.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOTAL_ROWS.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className={`whitespace-nowrap border-b border-line py-2 pr-3 text-left font-normal ${row.sub ? "pl-7 text-muted" : "pl-3"}`}
                  >
                    {row.label}
                  </th>
                  {windows.map((w) => (
                    <td key={w.key} className={`border-b border-line px-3 py-2 ${numeric}`}>
                      {row.value(w.usage)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </TableFrame>
        </Section>

        <Section id="daily-title" title="Kunlik so‘rovlar, 30 kun">
          <BarChart
            series={["So‘rovlar"]}
            points={daily.map((d) => ({ key: d.day, label: dayLabel(d.day), title: dayLabel(d.day), values: [d.requests] }))}
            tableLabel="AI so‘rovlar kunlar bo‘yicha"
            labelEvery={5}
          />
        </Section>
      </div>

      <Section id="top-title" title="Eng faol o‘qituvchilar, 30 kun" className="mt-12 max-w-4xl">
        {top.length ? (
          <TableFrame label="Eng faol o‘qituvchilar" minWidth="min-w-[36rem]">
            <thead>
              <tr>
                <th scope="col" className={th}>
                  O‘qituvchi
                </th>
                <th scope="col" className={`${th} ${numeric}`}>
                  So‘rovlar
                </th>
                <th scope="col" className={`${th} ${numeric}`}>
                  Xato
                </th>
                <th scope="col" className={`${th} ${numeric}`}>
                  Tokenlar
                </th>
                <th scope="col" className={`${th} ${numeric}`}>
                  Taxminiy narx
                </th>
              </tr>
            </thead>
            <tbody>
              {top.map((t) => (
                <tr key={t.userId}>
                  <td className={`${td} font-medium`}>{t.teacher}</td>
                  <td className={`${td} ${numeric}`}>{formatNumber(t.requests)}</td>
                  <td className={`${td} ${numeric}`}>
                    <Count value={t.errors} />
                  </td>
                  <td className={`${td} ${numeric}`}>{formatNumber(t.tokens)}</td>
                  <td className={`${td} ${numeric}`}>{formatUsd(t.costMicroUsd, true)}</td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        ) : (
          <Empty>So‘nggi 30 kunda AI yordamchidan foydalanilmagan.</Empty>
        )}
      </Section>

      <Section id="latest-title" title="So‘nggi so‘rovlar" className="mt-12">
        {latest.length ? (
          <TableFrame label="So‘nggi AI so‘rovlar" minWidth="min-w-[72rem]">
            <thead>
              <tr>
                {["Vaqt", "O‘qituvchi", "Maqola", "Holat"].map((label) => (
                  <th key={label} scope="col" className={th}>
                    {label}
                  </th>
                ))}
                {["Kirish", "Chiqish", "Kesh: o‘qish / yozish", "Narx", "Davomiylik"].map((label) => (
                  <th key={label} scope="col" className={`${th} ${numeric}`}>
                    {label}
                  </th>
                ))}
                <th scope="col" className={th}>
                  Xato kodi
                </th>
              </tr>
            </thead>
            <tbody>
              {latest.map((r) => (
                <tr key={r.id}>
                  <td className={`${td} whitespace-nowrap`}>{formatDateTime(r.createdAt)}</td>
                  <td className={`${td} whitespace-nowrap`}>{r.teacher}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {r.articleId === null ? (
                      <span className="text-muted">—</span>
                    ) : r.articleStatus && r.articleStatus !== "draft" ? (
                      // Ko‘rib chiqish paneli «Maqolalar» ro‘yxati ustida ochiladi
                      <Link href={`/admin/articles?view=${r.articleId}`} className="link">
                        №{r.articleId}
                      </Link>
                    ) : (
                      // Qoralama faqat muallifniki — havolasiz
                      <>
                        №{r.articleId} <span className="text-muted">(qoralama)</span>
                      </>
                    )}
                  </td>
                  <td className={td}>
                    <Chip tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Chip>
                    <span className="mt-1 block whitespace-nowrap text-xs text-muted">
                      {r.model}
                      {r.withPdf && " · PDF bilan"}
                    </span>
                  </td>
                  <td className={`${td} ${numeric}`}>{formatNumber(r.inputTokens)}</td>
                  <td className={`${td} ${numeric}`}>{formatNumber(r.outputTokens)}</td>
                  <td className={`${td} ${numeric} whitespace-nowrap`}>
                    {formatNumber(r.cacheReadTokens)} / {formatNumber(r.cacheWriteTokens)}
                  </td>
                  <td className={`${td} ${numeric}`}>{formatUsd(r.costMicroUsd, true)}</td>
                  <td className={`${td} ${numeric}`}>{formatDuration(r.durationMs)}</td>
                  <td className={td}>
                    {r.error ? <code className="text-xs">{r.error}</code> : <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        ) : (
          <Empty>Hali AI so‘rovlari yo‘q.</Empty>
        )}
      </Section>
    </AdminShell>
  );
}

function Section({ id, title, className = "", children }: { id: string; title: string; className?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`min-w-0 ${className}`}>
      <h2 id={id} className="font-serif text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-muted">{children}</p>;
}
