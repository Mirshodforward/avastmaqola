import { STATUS_LABELS, type ArticleStatus } from "@/lib/article-rules";

const STYLES: Record<ArticleStatus, string> = {
  draft: "border-line text-muted",
  submitted: "border-lapis/40 text-lapis",
  published: "border-tile/40 text-tile",
  rejected: "border-danger/40 text-danger",
};

/** Holat belgisi: rang yolg‘iz emas, doim matn bilan */
export function StatusChip({ status }: { status: ArticleStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border bg-paper px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
