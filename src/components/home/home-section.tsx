import type { ReactNode } from "react";
import { PUBLIC_WIDTH } from "@/components/public-width";

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
      <div className={`reveal grid gap-8 py-14 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 lg:py-20 ${PUBLIC_WIDTH}`}>
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
