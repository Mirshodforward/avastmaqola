import Link from "next/link";
import { AsmanMark } from "@/components/asman-mark";
import { LatestArticles } from "@/components/article/latest-articles";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { SiteBrand } from "@/components/site-brand";
import { SERVICE_NAME, UNIVERSITY_NAME } from "@/lib/brand";

export default function HomePage() {
  return (
    <>
      <SiteJsonLd />

      {/* Header va footer balandligi oldindan ma’lum: hero birinchi ekranni aniq to‘ldiradi, maqolalar oqim bilan kelganda ham siljimaydi (CLS) — faqat footer pastga suriladi */}
      {/* Shart: header/footer kontenti --header-h/--footer-h dan baland bo‘lmasin, aks holda sahifa doim scroll bo‘ladi */}
      <div className="contents [--footer-h:clamp(3rem,8svh,4rem)] [--header-h:clamp(4.5rem,11svh,5.5rem)] sm:[--footer-h:clamp(4.5rem,9svh,6rem)]">
        <header className="mx-auto flex min-h-(--header-h) w-[90%] items-center justify-between gap-2">
          <SiteBrand />
          {/* Ommaviy sahifalar header’i bilan bir xil yo‘llar; 390px’da "Kirish" hero’da bor, header’da faqat sm dan */}
          <nav aria-label="Asosiy" className="flex items-center gap-2">
            <Link href="/maqolalar" className="btn btn-ghost px-3">
              Maqolalar
            </Link>
            <Link href="/login" className="btn btn-secondary hidden sm:inline-flex">
              Kirish
            </Link>
            <Link href="/register" className="btn btn-primary hidden sm:inline-flex">
              Ro‘yxatdan o‘tish
            </Link>
          </nav>
        </header>

        {/* h1 va javob-jumla <main> ichida: ekran o‘quvchi "asosiy kontentga o‘tish"da ularni o‘tkazib yubormaydi */}
        <main className="flex flex-1 flex-col">
          {/* "Asman" — osmon: yuqori qism osmon, bo‘lim chegarasi ufq, belgi shu ufqda turadi */}
          {/* Osmon birinchi ekranni to‘ldiradi: bo‘shliq, sarlavha va belgi ekran balandligiga (svh) qarab kichrayadi */}
          <section
            aria-labelledby="hero-title"
            className="flex min-h-[calc(100svh_-_var(--header-h)_-_var(--footer-h))] flex-1 flex-col border-b border-line"
          >
            <div className="mx-auto grid w-[90%] flex-1 items-center gap-12 py-[clamp(1.25rem,5svh,4rem)] md:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
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

              {/* "Asman" — osmon: belgi ufq chizig‘idan ko‘tarilib chiqadi, so‘ng sekin suzib turadi (globals.css) */}
              <div aria-hidden="true" className="relative hidden justify-self-center md:block">
                <AsmanMark className="asman-rise block h-[clamp(10rem,34svh,22rem)] w-auto" />
                <span className="asman-horizon absolute inset-x-[-15%] -bottom-3 h-0.5 rounded-full bg-tile" />
              </div>
            </div>
          </section>

          {/* Maqolalar ufqdan pastda, scroll bilan ko‘rinadi. Ular bo‘lmasa blok bo‘sh: chiziq ham yo‘q, aks holda ufq bilan ikki qavat bo‘lardi */}
          <div className="bg-paper has-[section]:border-b has-[section]:border-line">
            <LatestArticles />
          </div>
        </main>

        <footer>
          <div className="mx-auto flex min-h-(--footer-h) w-[90%] flex-wrap items-center justify-between gap-4">
            {/* Telefonda belgi header’da turibdi: footer bir qatorda qolsin */}
            <div className="hidden sm:block">
              <SiteBrand />
            </div>
            <p className="text-sm text-muted">{SERVICE_NAME} xizmati asosida ishlaydi.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
