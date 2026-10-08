import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { AdminNav, type AdminTab } from "./admin-nav";

/** Admin sahifasi: kabinet sarlavhasi, bo‘limlar paneli va sahifa nomi */
export function AdminShell({
  current,
  title,
  lead,
  children,
}: {
  current: AdminTab;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DashboardShell admin wide>
      <AdminNav current={current} />
      <h1 className="mt-8 font-serif text-3xl font-semibold tracking-tight">{title}</h1>
      {lead && <p className="mt-2 max-w-3xl text-muted">{lead}</p>}
      {children}
    </DashboardShell>
  );
}

/** Ma’lumot kartasi: sarlavha, ixtiyoriy izoh va o‘ng tomonda havola */
export function Panel({
  id,
  title,
  note,
  action,
  className = "",
  children,
}: {
  id: string;
  title: string;
  note?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`min-w-0 rounded-xl border border-line bg-paper p-5 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={id} className="font-serif text-xl font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      {children}
    </section>
  );
}

/** Ko‘rsatkich kartasi (dl ichida). href bo‘lsa butun karta bosiladi. */
export function Stat({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  href?: string;
}) {
  return (
    <div className="relative rounded-xl border border-line bg-paper px-5 py-4 has-[a:hover]:border-lapis/50">
      <dt className="text-sm text-muted">
        {href ? (
          <Link href={href} className="after:absolute after:inset-0 after:rounded-xl hover:text-lapis">
            {label}
          </Link>
        ) : (
          label
        )}
      </dt>
      <dd className="mt-1 font-serif text-3xl font-semibold">{value}</dd>
      {detail && <dd className="mt-1 text-sm text-muted">{detail}</dd>}
    </div>
  );
}
