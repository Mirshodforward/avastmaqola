import Link from "next/link";
import { homeText } from "@/i18n/home";
import { localePath } from "@/i18n/lang";
import { publicText } from "@/i18n/public";
import type { Lang } from "@/lib/langs";
import { PORTAL_STEPS } from "@/lib/portal";
import { HomeSection } from "./home-section";
import { seq } from "./motion";

/**
 * Jarayon — haqiqiy ketma-ketlik, shuning uchun raqamlangan va chiziq bilan bog‘langan (kartasiz).
 * Telefonda tik chiziq, kompyuterda gorizontal. Oxirgi qadam (natija) to‘ldirilgan belgi bilan ajraladi.
 * Harakat: ro‘yxat ko‘rinishga kirganda belgilar ketma-ket paydo bo‘ladi va ular orasidagi chiziqlar chiziladi
 * (hammasi ro‘yxatning vaqt chizig‘ida — vt-grp / tl-grp).
 */
export function HomeSteps({ lang }: { lang: Lang }) {
  const t = homeText[lang].steps;
  // O‘zbekchasi /haqida bilan bitta manbadan (PORTAL_STEPS), tarjimalari lug‘atda
  const steps = lang === "uz" ? PORTAL_STEPS : publicText[lang].aboutPage.steps;
  return (
    <HomeSection
      id="steps-title"
      title={t.title}
      stacked
      action={
        <Link href={localePath(lang, "/haqida")} className="link">
          {t.about}
        </Link>
      }
    >
      {/* role="list": Tailwind list-style:none Safari/VoiceOver’da ro‘yxat ma’nosini olib tashlaydi */}
      <ol role="list" className="vt-grp grid lg:grid-cols-4 lg:gap-x-8">
        {steps.map((step, i) => {
          const done = i === steps.length - 1;
          return (
            <li
              key={step.title}
              style={seq(i)}
              className="m-rise tl-grp relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 pb-10 last:pb-0 lg:block lg:pb-0"
            >
              {!done && (
                <span
                  aria-hidden="true"
                  style={seq(i)}
                  className="m-connector tl-grp absolute top-10 bottom-0 left-5 w-px bg-line lg:top-5 lg:bottom-auto lg:left-[3.25rem] lg:-right-5 lg:h-px lg:w-auto"
                />
              )}
              <span
                aria-hidden="true"
                style={seq(i)}
                className={`m-pop tl-grp relative grid size-10 place-items-center rounded-full border-2 font-serif text-base font-semibold ${
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
