import Link from "next/link";
import { HomeAuthors } from "@/components/home/authors";
import { HomeCta } from "@/components/home/cta";
import { HomeFeatures } from "@/components/home/features";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { HomeArticles } from "@/components/home/latest-articles";
import { HomeNews } from "@/components/home/latest-news";
import { HomeStats } from "@/components/home/stats";
import { HomeSteps } from "@/components/home/steps";
import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { SiteBrand } from "@/components/site-brand";
import { UniversityLogo } from "@/components/university-logo";
import { UNIVERSITY_NAME } from "@/lib/brand";

export default function HomePage() {
  return (
    <>
      <SiteJsonLd />

      {/* Landing: hero birinchi ekranni to‘liq egallaydi (header balandligi oldindan ma’lum), qolgan bo‘limlar scroll bilan.
          Ma’lumotli bo‘limlar oqim bilan keladi; ular hero’dan pastda, shuning uchun birinchi ekran siljimaydi (CLS).
          Hamma blok bitta enda (PUBLIC_WIDTH): keng ekranda chetlarda bo‘sh joy, kontent markazda */}
      <div className="contents [--header-h:clamp(4.5rem,11svh,5.5rem)]">
        <header className={`flex min-h-(--header-h) items-center justify-between gap-2 ${PUBLIC_WIDTH}`}>
          <SiteBrand />
          {/* Ommaviy sahifalar bilan bitta menyu; 390px’da "Kirish" hero’da bor, header’da faqat sm dan */}
          <PublicNav />
        </header>

        {/* h1 va javob-jumla <main> ichida: ekran o‘quvchi "asosiy kontentga o‘tish"da ularni o‘tkazib yubormaydi */}
        <main className="flex flex-1 flex-col">
          {/* "Asman" — osmon: yuqori qism osmon, bo‘lim chegarasi ufq, belgi shu ufqda turadi */}
          {/* Osmon birinchi ekranni to‘ldiradi: bo‘shliq, sarlavha va belgi ekran balandligiga (svh) qarab kichrayadi */}
          <section aria-labelledby="hero-title" className="flex min-h-[calc(100svh_-_var(--header-h))] flex-col border-b border-line">
            <div
              className={`grid flex-1 items-center gap-12 py-[clamp(1.25rem,5svh,4rem)] lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14 ${PUBLIC_WIDTH}`}
            >
              <div>
                <h1
                  id="hero-title"
                  className="max-w-[11em] font-serif text-[length:clamp(2.25rem,min(9vw,9svh),5rem)] leading-[1.05] font-semibold tracking-tight text-balance"
                >
                  {`${UNIVERSITY_NAME} ilmiy maqolalari`}
                </h1>
                {/* AI va qidiruv tizimlari iqtibos qiladigan jumla: kim, nima, kim uchun. Bitta matn tuguni bo‘lib qolsin */}
                <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
                  {`${UNIVERSITY_NAME} o‘qituvchilari ilmiy maqolalarini shu portalga joylaydi. Universitet tasdiqlagan har bir maqola o‘zbek, rus va ingliz tilidagi annotatsiyasi va PDF fayli bilan alohida sahifada hammaga ochiq bo‘ladi.`}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/register" className="btn btn-primary btn-lg">
                    Ro‘yxatdan o‘tish
                  </Link>
                  <Link href="/login" className="btn btn-secondary btn-lg">
                    Kirish
                  </Link>
                </div>
                <p className="mt-4 text-sm text-muted">Parol kerak emas: tasdiqlash kodi Telegram orqali keladi.</p>
              </div>

              {/* "Asman" — osmon: rasmiy logo (belgi va "ASMAN UNIVERSITY", login sahifasidagidek) ufq chizig‘idan
                  ko‘tarilib chiqadi, so‘ng sekin suzib turadi (globals.css). Nom h1’da bor — bu yerda bezak.
                  Logo keng: faqat lg dan, balandligi ekran eniga ham bog‘liq — matn ustunini siqmasin */}
              <div aria-hidden="true" className="relative hidden justify-self-center lg:block">
                <UniversityLogo className="asman-rise block h-[clamp(10rem,min(36svh,22vw),24rem)] w-auto" />
                <span className="asman-horizon absolute inset-x-[-12%] -bottom-4 h-0.5 rounded-full bg-tile" />
              </div>
            </div>
          </section>

          {/* Ufqdan pastdagi bo‘limlar: fon navbat bilan oq va kulrang. Ma’lumotsiz bo‘lim (maqola, yangilik yo‘q) chizilmaydi */}
          <HomeStats />
          <HomeSteps />
          <HomeFeatures />
          <HomeArticles />
          <HomeNews />
          <HomeAuthors />
          <HomeCta />
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
