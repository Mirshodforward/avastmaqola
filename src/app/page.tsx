import Link from "next/link";
import { HomeAnatomy } from "@/components/home/anatomy";
import { HomeAuthors } from "@/components/home/authors";
import { HomeCta } from "@/components/home/cta";
import { HomeArticles } from "@/components/home/latest-articles";
import { HomeNews } from "@/components/home/latest-news";
import { HomeStats } from "@/components/home/stats";
import { HomeSteps } from "@/components/home/steps";
import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { SiteBrand } from "@/components/site-brand";
import { UniversityLogo } from "@/components/university-logo";
import { UNIVERSITY_NAME } from "@/lib/brand";

export default function HomePage() {
  return (
    <>
      <SiteJsonLd />

      {/* Landing. Hero birinchi ekranni to‘liq egallaydi: yuqorida osmon, pastda yer, ularni ufq chizig‘i ajratadi.
          Ma’lumotli bo‘limlar oqim bilan keladi; ular hero’dan pastda, shuning uchun birinchi ekran siljimaydi (CLS).
          Hamma blok bitta enda (PUBLIC_WIDTH): keng ekranda chetlarda bo‘sh joy, kontent markazda */}
      <div className="contents [--header-h:4.5rem]">
        {/* Yopishqoq header: scroll’da yarim shaffof fon va pastki chiziq paydo bo‘ladi (globals.css .home-header) */}
        <header className="home-header sticky top-0 z-30 border-b border-transparent bg-mist/80 backdrop-blur-md">
          <div className={`flex h-(--header-h) items-center justify-between gap-2 ${PUBLIC_WIDTH}`}>
            <SiteBrand />
            <PublicNav />
          </div>
        </header>

        {/* h1 va javob-jumla <main> ichida: ekran o‘quvchi "asosiy kontentga o‘tish"da ularni o‘tkazib yubormaydi */}
        <main className="flex flex-1 flex-col">
          <section aria-labelledby="hero-title" className="flex min-h-[calc(100svh_-_var(--header-h))] flex-col">
            <div className="home-sky flex flex-1 flex-col">
              <div
                className={`grid flex-1 items-end gap-10 pt-[clamp(2rem,6svh,5rem)] lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 ${PUBLIC_WIDTH}`}
              >
                <div className="pb-10 lg:self-center lg:pb-0">
                  <h1
                    id="hero-title"
                    className="max-w-[11em] font-serif text-[length:clamp(2.5rem,min(4.6vw,9svh),5rem)] leading-[1.04] font-semibold tracking-[-0.02em] text-balance"
                  >
                    {`${UNIVERSITY_NAME} ilmiy maqolalari`}
                  </h1>
                  {/* AI va qidiruv tizimlari iqtibos qiladigan jumla: kim, nima, kim uchun. Bitta matn tuguni bo‘lib qolsin */}
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
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

                {/* Rasmiy logo (belgi va "ASMAN UNIVERSITY") ufq chizig‘ida turadi: ufqdan ko‘tarilib chiqadi, so‘ng sekin
                    suzib turadi (globals.css). Nom h1’da bor — bu yerda bezak. Faqat lg dan: tor ekranda matnni siqmasin */}
                <div aria-hidden="true" className="hidden pb-6 lg:block">
                  <UniversityLogo className="asman-rise block h-[clamp(11rem,min(40svh,26vw),26rem)] w-auto" />
                </div>
              </div>
            </div>

            {/* Yer: ufq chizig‘i shu blokning yuqori cheti (.home-ground::before), raqamlar uning ostida */}
            <div className="home-ground">
              <HomeStats />
            </div>
          </section>

          <HomeSteps />
          <HomeAnatomy />
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
