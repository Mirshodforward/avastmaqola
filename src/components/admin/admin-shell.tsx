import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { AdminNav, type AdminTab } from "./admin-nav";

/** Admin sahifasi: kabinet sarlavhasi, bo‘limlar paneli, sahifa nomi va (ixtiyoriy) uning yonida amal tugmasi */
export function AdminShell({
  current,
  title,
  action,
  children,
}: {
  current?: AdminTab;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DashboardShell admin>
      <AdminNav current={current} />
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {action}
      </div>
      {children}
    </DashboardShell>
  );
}

export type StatItem = { label: string; value: ReactNode; detail?: ReactNode; href?: string };

/**
 * Ko‘rsatkichlar qatori — bosh sahifadagi kabi kartasiz: nomi, serif raqam, qisqa izoh; keng ekranda ustunlar
 * ingichka chiziq bilan ajraladi. size="sm" — ikkinchi darajali ko‘rsatkichlar. href bo‘lsa butun ustun bosiladi.
 */
export function Stats({ items, size = "lg", className = "" }: { items: StatItem[]; size?: "lg" | "sm"; className?: string }) {
  return (
    <dl className={`grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4 ${className}`}>
      {items.map((s) => (
        <div key={s.label} className="relative min-w-0 lg:border-l lg:border-line lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
          <dt className="text-sm text-muted">
            {s.href ? (
              <Link href={s.href} className="after:absolute after:inset-0 hover:text-lapis">
                {s.label}
              </Link>
            ) : (
              s.label
            )}
          </dt>
          <dd className={`mt-1 font-serif font-semibold tabular-nums ${size === "lg" ? "text-3xl" : "text-xl"}`}>{s.value}</dd>
          {s.detail && <dd className="mt-0.5 text-sm text-muted">{s.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}
