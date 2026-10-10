import Link from "next/link";
import { PORTAL_STEPS } from "@/lib/portal";
import { HomeSection } from "./home-section";

/**
 * Jarayon — haqiqiy ketma-ketlik, shuning uchun raqamlangan va chiziq bilan bog‘langan (kartasiz).
 * Telefonda tik chiziq, kompyuterda gorizontal. Oxirgi qadam (natija) to‘ldirilgan belgi bilan ajraladi.
 */
export function HomeSteps() {
  return (
    <HomeSection
      id="steps-title"
      title="Maqola qanday joylanadi"
      stacked
      action={
        <Link href="/haqida" className="link">
          Portal haqida
        </Link>
      }
    >
      <ol className="grid lg:grid-cols-4 lg:gap-x-8">
        {PORTAL_STEPS.map((step, i) => {
          const done = i === PORTAL_STEPS.length - 1;
          return (
            <li key={step.title} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 pb-10 last:pb-0 lg:block lg:pb-0">
              {!done && (
                <span
                  aria-hidden="true"
                  className="absolute top-10 bottom-0 left-5 w-px bg-line lg:top-5 lg:bottom-auto lg:left-[3.25rem] lg:-right-5 lg:h-px lg:w-auto"
                />
              )}
              <span
                aria-hidden="true"
                className={`relative grid size-10 place-items-center rounded-full border-2 font-serif text-base font-semibold ${
                  done ? "border-lapis bg-lapis text-on-lapis" : "border-lapis bg-paper text-lapis"
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <div className="lg:mt-5">
                <p className="font-medium">{step.title}</p>
                <p className="mt-1 max-w-72 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </HomeSection>
  );
}
