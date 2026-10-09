import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { UNIVERSITY_NAME } from "@/lib/brand";
import { PORTAL_STEPS } from "@/lib/portal";

export const metadata: Metadata = {
  title: "Portal haqida",
  description: `${UNIVERSITY_NAME} ilmiy maqolalar portali: maqola qanday joylanadi, ochiq kirish va iqtibos.`,
  alternates: { canonical: "/haqida" },
};

export default function AboutPage() {
  return (
    <>
      <PublicHeader />
      <main className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
        {/* Uzun matn: o‘qish qulay bo‘lishi uchun tor ustun, chap cheti header bilan bir chiziqda */}
        <div className="max-w-3xl">
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Portal haqida</h1>
          <p className="mt-4 text-lg leading-relaxed">
            {`${UNIVERSITY_NAME} o‘qituvchilari ilmiy maqolalarini shu portalga joylaydi. Universitet tasdiqlagan har bir maqola o‘zbek, rus va ingliz tilidagi annotatsiyasi va PDF fayli bilan alohida sahifada hammaga ochiq.`}
          </p>
  
          <section aria-labelledby="steps-title" className="mt-10">
            <h2 id="steps-title" className="font-serif text-2xl font-semibold">
              Maqola qanday joylanadi
            </h2>
            <ol className="mt-4 space-y-4">
              {PORTAL_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-lapis text-sm font-semibold text-on-lapis">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
  
          <section aria-labelledby="open-title" className="mt-10">
            <h2 id="open-title" className="font-serif text-2xl font-semibold">
              Ochiq kirish va iqtibos
            </h2>
            <p className="mt-3 leading-relaxed">
              Maqolalar ochiq kirishda (CC BY 4.0): muallifni ko‘rsatgan holda o‘qish va tarqatish mumkin. Har bir sahifada Google Scholar
              uchun meta teglar va tayyor iqtibos (APA, BibTeX) bor. O‘qituvchi profiliga ORCID iD va Google Scholar profili bog‘lanadi.
            </p>
          </section>
  
          <section aria-labelledby="authors-title" className="mt-10 rounded-xl border border-line bg-paper p-6">
            <h2 id="authors-title" className="font-serif text-2xl font-semibold">
              Mualliflarga
            </h2>
            <p className="mt-3 leading-relaxed">
              {`Portalga ${UNIVERSITY_NAME} mualliflari maqola joylaydi. Parol kerak emas: tasdiqlash kodi Telegram orqali keladi.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary">
                Ro‘yxatdan o‘tish
              </Link>
              <Link href="/login" className="btn btn-secondary">
                Kirish
              </Link>
            </div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
