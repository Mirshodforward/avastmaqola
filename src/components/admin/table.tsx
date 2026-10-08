import type { ReactNode } from "react";
import { formatNumber } from "./format";

/** Tor ekranda jadval o‘z ichida gorizontal suriladi (sahifa emas); hudud klaviatura bilan ham suriladi */
export function TableFrame({
  label,
  minWidth = "min-w-[40rem]",
  children,
}: {
  label: string;
  minWidth?: string;
  children: ReactNode;
}) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-line bg-paper">
      <table className={`w-full ${minWidth} text-left text-sm [&_tbody_tr:last-child>*]:border-b-0`}>
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </div>
  );
}

export const th = "whitespace-nowrap border-b border-line bg-mist px-4 py-2.5 text-xs font-medium text-muted";
export const td = "border-b border-line px-4 py-3 align-top";
export const numeric = "text-right tabular-nums";

/** Nol xira ko‘rinadi — ustunda noldan farqlilari ko‘zga tashlanadi */
export function Count({ value }: { value: number }) {
  return <span className={value ? undefined : "text-muted"}>{formatNumber(value)}</span>;
}
