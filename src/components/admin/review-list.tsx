import Link from "next/link";
import { StatusChip } from "@/components/article/status-chip";
import type { ArticleStatus } from "@/lib/article-rules";
import { formatDate } from "@/lib/format";
import { issueLabel } from "@/lib/issue";
import { formatWait, hoursSince } from "./format";

export type ReviewItem = {
  id: number;
  title: string;
  author: string;
  status: ArticleStatus;
  issueNo: number;
  issueSeq: number | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
};

/**
 * Ko‘rib chiqish ro‘yxati — admin navbati, umumiy sahifa va moderator uchun bitta ko‘rinish. Sarlavha — havola
 * (butun qator bosiladi), u panelni ochadi; data-review-id bo‘yicha panel yopilganda fokus shu qatorga qaytadi.
 * Navbatda o‘ngda kutish vaqti, so‘nggi qarorlarda holat va qaror sanasi. Telefonda ular muallif qatori yonida
 * (sm:contents): sarlavha butun kenglikni oladi.
 */
export function ReviewList({
  items,
  href,
  decided = false,
  className = "",
}: {
  items: ReviewItem[];
  href: (id: number) => string;
  decided?: boolean;
  className?: string;
}) {
  return (
    <ul className={`divide-y divide-line border-y border-line ${className}`}>
      {items.map((a) => (
        <li key={a.id} className="relative grid grid-cols-1 gap-x-6 gap-y-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline">
          <Link
            href={href(a.id)}
            scroll={false}
            data-review-id={a.id}
            className="break-words font-medium leading-snug after:absolute after:inset-0 hover:text-lapis"
          >
            №{a.id}. {a.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted sm:contents">
            <p className="sm:col-start-1">
              {a.author} · {issueLabel(a.issueNo, a.issueSeq)}
            </p>
            {decided ? (
              <p className="flex items-center gap-3 sm:col-start-2 sm:row-start-1 sm:justify-self-end">
                <StatusChip status={a.status} />
                {a.reviewedAt && <span className="whitespace-nowrap">{formatDate(a.reviewedAt)}</span>}
              </p>
            ) : (
              a.submittedAt && (
                <p className="whitespace-nowrap sm:col-start-2 sm:row-start-1 sm:justify-self-end">
                  {formatWait(hoursSince(a.submittedAt))} kutmoqda
                </p>
              )
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
