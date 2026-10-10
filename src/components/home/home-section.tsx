import type { ReactNode } from "react";
import { PUBLIC_WIDTH } from "@/components/public-width";

/**
 * Bosh sahifa bo‘limi. Ikki tartib:
 * - aside (standart): chapda sarlavha va havola, o‘ngda mazmun — ro‘yxatlar (maqola, yangilik, muallif) uchun;
 * - stacked: tepada sarlavha, pastda butun enli mazmun — jarayon va sxema uchun.
 * tone — fon: bo‘limlar navbat bilan oq (paper) va kulrang (mist), chegarasi ingichka chiziq.
 */
export function HomeSection({
  id,
  title,
  action,
  tone = "mist",
  stacked = false,
  children,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  tone?: "mist" | "paper";
  stacked?: boolean;
  children: ReactNode;
}) {
  const heading = (
    <h2 id={id} className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
      {title}
    </h2>
  );
  return (
    <section aria-labelledby={id} className={`border-t border-line ${tone === "paper" ? "bg-paper" : ""}`}>
      {stacked ? (
        <div className={`py-16 lg:py-24 ${PUBLIC_WIDTH}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            {heading}
            {action}
          </div>
          <div className="mt-10 lg:mt-14">{children}</div>
        </div>
      ) : (
        <div className={`grid gap-8 py-16 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 lg:py-24 ${PUBLIC_WIDTH}`}>
          <div>
            {heading}
            {action && <div className="mt-4">{action}</div>}
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      )}
    </section>
  );
}
