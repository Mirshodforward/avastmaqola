import Link from "next/link";

export function Wordmark() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink"
    >
      <svg viewBox="0 0 28 28" className="size-7" aria-hidden="true">
        <path d="M5 3h13l6 6v16H5z" fill="var(--lapis)" />
        <path d="M18 3v6h6z" fill="var(--tile)" />
        <path
          d="M9 14h10M9 18h10M9 22h6"
          stroke="var(--on-lapis)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      Avtomaqola
    </Link>
  );
}
