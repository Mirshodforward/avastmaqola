import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { langAlternates, localePath } from "@/i18n/lang";
import { aboutPageText } from "@/i18n/page-haqida";
import { pageLang } from "@/i18n/server";
import { UNIVERSITY_NAME } from "@/lib/brand";
import type { Lang } from "@/lib/langs";

type Props = PageProps<"/[lang]/haqida">;

// generateMetadata va sahifa til params’ini o‘qiydi — instant tekshiruvi o‘chiq (bosh sahifadagi kabi)
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const t = aboutPageText[lang];
  return { title: t.title, description: t.description(UNIVERSITY_NAME), alternates: langAlternates(lang, "/haqida") };
}

const H2 = "font-serif text-2xl font-semibold tracking-tight";

export default async function AboutPage({ params }: Props) {
  const lang = await pageLang(params);
  const t = aboutPageText[lang];
  return (
    <>
      <PublicHeader />
      {/* Chap cheti header bilan bir chiziqda. Matn qatori ~75 belgi: Onest’da 1ch (raqam) keng, shuning uchun
          max-w-prose (65ch) ~95 belgi berardi — o‘rniga 34em (shrift o‘lchamiga mos) */}
      <main className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.title}</h1>
        <p className="mt-4 max-w-[34em] text-lg leading-relaxed">{t.intro(UNIVERSITY_NAME)}</p>

        <section aria-labelledby="steps-title" className="mt-12 border-t border-line pt-8">
          <h2 id="steps-title" className={H2}>
            {t.stepsTitle}
          </h2>
          <Steps lang={lang} />
        </section>

        {/* Litsenziya maqolaga qarab har xil (CC BY 4.0 — sukut, CC BY-NC 4.0 yoki barcha huquqlar himoyalangan):
            bu yerda va’da berilmaydi, har bir maqola sahifasi o‘z litsenziyasini ko‘rsatadi */}
        <section aria-labelledby="open-title" className="mt-12 border-t border-line pt-8">
          <h2 id="open-title" className={H2}>
            {t.openTitle}
          </h2>
          <p className="mt-4 max-w-[34em] leading-relaxed">{t.openText}</p>
        </section>

        <section aria-labelledby="authors-title" className="mt-12 border-t border-line pt-8">
          <h2 id="authors-title" className={H2}>
            {t.authorsTitle}
          </h2>
          <p className="mt-4 max-w-[34em] leading-relaxed">{t.noPassword}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={localePath(lang, "/register")} className="btn btn-primary btn-lg">
              {t.register}
            </Link>
            <Link href={localePath(lang, "/login")} className="btn btn-secondary btn-lg">
              {t.login}
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

/**
 * Bosh sahifadagi jarayon bilan bir xil ko‘rinish (harakatsiz): raqamli halqalar chiziq bilan bog‘langan, oxirgi qadam
 * (natija) to‘ldirilgan belgi. Telefonda tik chiziq, kompyuterda gorizontal.
 */
function Steps({ lang }: { lang: Lang }) {
  const steps = aboutPageText[lang].steps;
  return (
    // role="list": Tailwind list-style:none Safari/VoiceOver’da ro‘yxat ma’nosini olib tashlaydi
    <ol role="list" className="mt-8 grid lg:grid-cols-4 lg:gap-x-8">
      {steps.map((step, i) => {
        const done = i === steps.length - 1;
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
  );
}
