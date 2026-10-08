import Link from "next/link";

/** Filtrlarni saqlagan holda havola: bo‘sh qiymatlar URL’ga tushmaydi */
export function withParams(path: string, params: Record<string, string | number | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, String(value));
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Sahifalar" className="mt-4 flex items-center justify-between gap-3 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-secondary">
          <span aria-hidden="true">←</span> Oldingi
        </Link>
      ) : (
        <span />
      )}
      <span className="tabular-nums text-muted">
        Sahifa {page} / {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn btn-secondary">
          Keyingi <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
