import type { ReactNode } from "react";
import { formatNumber } from "./format";

/**
 * Jadval ro‘yxatlar bilan bir xil ko‘rinishda: kartasiz, tepada va pastda ingichka chiziq, qatorlar orasida chiziq.
 * Sahifa enidan keng jadval o‘z ichida gorizontal suriladi (sahifa emas); hudud klaviatura bilan ham suriladi.
 * relative: ichidagi absolute elementlar (sr-only matn, qatorni bosiladigan qiladigan qatlam) ham shu yerda kesiladi
 */
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
    <div role="region" aria-label={label} tabIndex={0} className="relative mt-4 overflow-x-auto border-y border-line">
      <table className={`w-full ${minWidth} text-left text-sm [&_tbody_tr:last-child>*]:border-b-0`}>
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </div>
  );
}

const head = "border-b border-line px-3 py-2.5 align-bottom text-xs font-medium text-muted";
export const th = `whitespace-nowrap ${head}`;
/** Tor raqamli ustun: uzun sarlavha ikki qatorga o‘raladi, jadval sahifa eniga sig‘adi */
export const thWrap = head;
export const td = "border-b border-line px-3 py-3 align-top";
export const numeric = "text-right tabular-nums";

/** Nol xira ko‘rinadi — ustunda noldan farqlilari ko‘zga tashlanadi */
export function Count({ value }: { value: number }) {
  return <span className={value ? undefined : "text-muted"}>{formatNumber(value)}</span>;
}
