import type { ReactNode } from "react";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { seq } from "./motion";

/**
 * Bosh sahifa bo‘limi. Ikki tartib:
 * - aside (standart): chapda sarlavha va havola, o‘ngda mazmun — ro‘yxatlar (maqola, yangilik, muallif) uchun;
 * - stacked: tepada sarlavha, pastki butun enli mazmun — jarayon va sxema uchun.
 * tone — fon: bo‘limlar navbat bilan oq (paper) va kulrang (mist), chegarasi ingichka chiziq.
 * Harakat: bo‘lim yuqori chizig‘i kirayotganda chapdan o‘ngga chiziladi (ufq), sarlavha va havola ko‘tarilib chiqadi.
 * Hammasi bo‘limning o‘z vaqt chizig‘ida (vt-sec / tl-sec): 1px chiziq o‘z view()’ida bir zumda tugardi.
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
    <h2 id={id} className="m-rise tl-sec font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
      {title}
    </h2>
  );
  return (
    <section aria-labelledby={id} className={`vt-sec relative ${tone === "paper" ? "bg-paper" : ""}`}>
      <span aria-hidden="true" className="m-line tl-sec absolute inset-x-0 top-0 h-px bg-line" />
      {stacked ? (
        <div className={`py-16 lg:py-24 ${PUBLIC_WIDTH}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            {heading}
            {action && (
              <div className="m-rise tl-sec" style={seq(1)}>
                {action}
              </div>
            )}
          </div>
          <div className="mt-10 lg:mt-14">{children}</div>
        </div>
      ) : (
        <div className={`grid gap-8 py-16 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 lg:py-24 ${PUBLIC_WIDTH}`}>
          <div>
            {heading}
            {action && (
              <div className="m-rise tl-sec mt-4" style={seq(1)}>
                {action}
              </div>
            )}
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      )}
    </section>
  );
}
