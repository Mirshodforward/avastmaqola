import type { Metadata } from "next";
import Link from "next/link";
import { HomeAnatomy } from "@/components/home/anatomy";
import { HomeAuthors } from "@/components/home/authors";
import { HomeCta } from "@/components/home/cta";
import { HomeArticles } from "@/components/home/latest-articles";
import { HomeNews } from "@/components/home/latest-news";
import { delay } from "@/components/home/motion";
import { HomeStats } from "@/components/home/stats";
import { HomeSteps } from "@/components/home/steps";
import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { SiteBrand } from "@/components/site-brand";
import { UniversityLogo } from "@/components/university-logo";
import { commonText } from "@/i18n/common";
import { homeText } from "@/i18n/home";
import { localePath } from "@/i18n/lang";
import { SITE_NAME, UNIVERSITY_NAME } from "@/lib/brand";
import { LANGS, type Lang } from "@/lib/langs";

/** Har bir tildagi bosh sahifa boshqalariga hreflang bilan bog‘lanadi: qidiruv tizimi foydalanuvchi tilidagisini ko‘rsatadi */
export function homeMetadata(lang: Lang): Metadata {
  const languages = { ...Object.fromEntries(LANGS.map((l) => [l, localePath(l, "/")])), "x-default": "/" };
  const alternates = { canonical: localePath(lang, "/"), languages };
  // O‘zbekchasi — root layout’dagi sarlavha va tavsif
  if (lang === "uz") return { alternates };
  const t = commonText[lang].rootLayout;
  return {
    title: { absolute: t.defaultTitle(SITE_NAME) },
    description: t.description,
    alternates,
    // Sahifadagi openGraph layout’dagini butunlay almashtiradi — sayt nomi va til qayta yoziladi
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: lang === "ru" ? "ru_RU" : "en_US",
      url: localePath(lang, "/"),
      title: t.defaultTitle(SITE_NAME),
      description: t.description,
    },
  };
}

/**
 * Landing: `/` (o‘zbekcha), `/ru`, `/en`. Hero birinchi ekranni to‘liq egallaydi: yuqorida osmon, pastda yer, ularni ufq
 * chizig‘i ajratadi. Ma’lumotli bo‘limlar oqim bilan keladi; ular hero’dan pastda, shuning uchun birinchi ekran
 * siljimaydi (CLS). Hamma blok bitta enda (PUBLIC_WIDTH): keng ekranda chetlarda bo‘sh joy, kontent markazda.
 * Harakat: yuklanganda hero ketma-ket (l-*), scroll’da har bir blok o‘z o‘rniga kirganda (m-*) — globals.css.
 * Sahifa tili ([lang]/layout.tsx o‘rami) — matn, sana va havolalar shu tilda.
 */
export function HomePage({ lang }: { lang: Lang }) {
  const t = homeText[lang].homePage;
  return (
    <>
      <SiteJsonLd />

      <div className="contents [--header-h:4.5rem]">
        {/* Yopishqoq header: scroll’da yarim shaffof fon va pastki chiziq paydo bo‘ladi (globals.css .home-header).
            l-down ichki div’da: header’ning o‘zida chiziq animatsiyasi turibdi, ikki animation bir elementda bir-birini bosardi */}
        <header className="home-header sticky top-0 z-30 border-b border-line bg-mist/80 backdrop-blur-md">
          <div className={`l-down flex h-(--header-h) items-center justify-between gap-2 ${PUBLIC_WIDTH}`}>
            <SiteBrand lang={lang} />
            <PublicNav />
          </div>
        </header>

        {/* h1 va javob-jumla <main> ichida: ekran o‘quvchi "asosiy kontentga o‘tish"da ularni o‘tkazib yubormaydi.
            overflow-x-clip: o‘ngdan kirib kelayotgan elementlar (m-slide) gorizontal scroll hosil qilmasin */}
        <main className="flex flex-1 flex-col overflow-x-clip">
          {/* −1px: header’ning pastki chizig‘i — hero aynan bir ekranga sig‘sin */}
          <section aria-labelledby="hero-title" className="flex min-h-[calc(100svh_-_var(--header-h)_-_1px)] flex-col">
            <div className="home-sky flex flex-1 flex-col">
              <div
                className={`hero-recede grid flex-1 items-end gap-10 py-[clamp(2rem,6svh,5rem)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 ${PUBLIC_WIDTH}`}
              >
                <div>
                  <h1
                    id="hero-title"
                    style={delay(0.05)}
                    className="l-in max-w-[11em] font-serif text-[length:clamp(2.5rem,min(4.6vw,9svh),5rem)] leading-[1.04] font-semibold tracking-[-0.02em] text-balance 2xl:text-[length:clamp(2.5rem,min(3.6vw,9svh),5rem)]"
                  >
                    {t.title(UNIVERSITY_NAME)}
                  </h1>
                  {/* AI va qidiruv tizimlari iqtibos qiladigan jumla: kim, nima, kim uchun. Bitta matn tuguni bo‘lib qolsin */}
                  {/* text-ink/75: osmon gradienti ufq tomon quyuqlashadi, text-muted u yerda AA kontrastdan (4.5) pastga tushardi */}
                  <p style={delay(0.17)} className="l-in mt-6 max-w-xl text-base leading-relaxed text-ink/75 sm:text-lg">
                    {t.lead(UNIVERSITY_NAME)}
                  </p>
                  <div style={delay(0.29)} className="l-in mt-8 flex flex-wrap gap-3">
                    <Link href="/register" className="btn btn-primary btn-lg">
                      {t.register}
                    </Link>
                    <Link href="/login" className="btn btn-secondary btn-lg">
                      {t.login}
                    </Link>
                  </div>
                  <p style={delay(0.41)} className="l-in mt-4 text-sm text-ink/75">
                    {t.noPassword}
                  </p>
                </div>

                {/* Rasmiy logo (belgi va "ASMAN UNIVERSITY") matn bloki bilan bir balandlikda (egasining so‘rovi): pastdan
                    ko‘tarilib chiqadi, so‘ng sekin suzib turadi (globals.css). Nom h1’da bor — bu yerda bezak.
                    Faqat lg dan: tor ekranda matnni siqmasin. Orqasida chiziq yoki yoy yo‘q (egasining so‘rovi) */}
                <div aria-hidden="true" className="hidden lg:block">
                  <UniversityLogo className="asman-rise block h-[clamp(11rem,min(40svh,26vw),26rem)] w-auto" />
                </div>
              </div>
            </div>

            {/* Yer: ufq chizig‘i shu blokning yuqori cheti (.home-ground::before), raqamlar uning ostida */}
            <div className="home-ground">
              <HomeStats lang={lang} />
            </div>
          </section>

          <HomeSteps lang={lang} />
          <HomeAnatomy lang={lang} />
          <HomeArticles lang={lang} />
          <HomeNews lang={lang} />
          <HomeAuthors lang={lang} />
          <HomeCta lang={lang} />
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
