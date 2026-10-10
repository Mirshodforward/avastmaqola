import Link from "next/link";
import { StatusChip } from "@/components/article/status-chip";
import { titleIn, type ArticleStatus } from "@/lib/article-rules";
import { formatDate } from "@/lib/format";
import type { Lang } from "@/lib/langs";

export type OwnArticleItem = {
  id: number;
  status: ArticleStatus;
  lang: Lang | null;
  titleUz: string | null;
  titleRu: string | null;
  titleEn: string | null;
  reviewNote: string | null;
  updatedAt: Date;
};

/** O‘qituvchining maqolalari: kabinetdagi «So‘nggi maqolalar» va «Maqolalarim» sahifasi uchun bitta ko‘rinish */
export function OwnArticleList({ articles }: { articles: OwnArticleItem[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {articles.map((a) => (
        <li key={a.id} className="grid gap-x-6 gap-y-1.5 py-4 sm:grid-cols-[1fr_auto_8.5rem] sm:items-baseline">
          <Link href={`/dashboard/articles/${a.id}`} className="min-w-0 font-medium hover:text-lapis">
            {titleIn(a)}
          </Link>
          <div className="flex items-center gap-3 sm:contents">
            <StatusChip status={a.status} />
            <span className="text-sm text-muted tabular-nums sm:text-right">{formatDate(a.updatedAt)}</span>
          </div>
          {a.status === "rejected" && a.reviewNote && (
            <p className="text-sm text-danger sm:col-span-3">Izoh: {a.reviewNote}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
