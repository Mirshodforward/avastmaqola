import type { ReactNode } from "react";

/**
 * Bosh sahifaning yagona eni: header, hero, bo‘limlar va footer bir chiziqda. Keng ekranda chetlarda 15–20% bo‘sh
 * joy (egasining so‘rovi). xl’da 70%: bo‘limlar menyusi (~870px) bir qatorga sig‘ishi uchun; 2xl dan 60%.
 */
export const HOME_WIDTH = "mx-auto w-[90%] xl:w-[70%] 2xl:w-[60%]";

/**
 * Bosh sahifa bo‘limi: chapda sarlavha (va havola), o‘ngda mazmun.
 * tone — fon: bo‘limlar navbat bilan oq (paper) va kulrang (mist), sahifa uzun bo‘lsa ham ko‘z adashmaydi.
 */
export function HomeSection({
  id,
  title,
  action,
  tone = "mist",
  children,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  tone?: "mist" | "paper";
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`border-b border-line ${tone === "paper" ? "bg-paper" : ""}`}>
      <div className={`reveal grid gap-8 py-14 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 lg:py-20 ${HOME_WIDTH}`}>
        <div>
          <h2 id={id} className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {action && <div className="mt-4">{action}</div>}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
