import type { ReactNode } from "react";
import { STATUS_LABELS, type ArticleStatus } from "@/lib/article-rules";

/** To‘rt ohang: neytral (qoralama, rol), jarayonda (lapis), ijobiy (tile), xato yoki qaytarilgan (danger) */
export type ChipTone = "neutral" | "lapis" | "tile" | "danger";

// Matn oq (paper) fonda: muted 5,9:1, lapis 10:1, tile 5:1, danger 6,6:1 — AA (qorong‘i rejimda ham)
const TONES: Record<ChipTone, string> = {
  neutral: "border-line text-muted",
  lapis: "border-lapis/40 text-lapis",
  tile: "border-tile/40 text-tile",
  danger: "border-danger/40 text-danger",
};

/** Barcha holat belgilari uchun bitta ko‘rinish. Rang yolg‘iz emas, doim matn bilan */
export function Chip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border bg-paper px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<ArticleStatus, ChipTone> = {
  draft: "neutral",
  submitted: "lapis",
  published: "tile",
  rejected: "danger",
};

/** Maqola holati */
export function StatusChip({ status }: { status: ArticleStatus }) {
  return <Chip tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Chip>;
}
