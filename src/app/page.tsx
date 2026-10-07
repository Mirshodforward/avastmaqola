import Link from "next/link";
import { Manuscript } from "@/components/manuscript";
import { Wordmark } from "@/components/wordmark";

const steps = [
  {
    title: "Ro‘yxatdan o‘ting",
    text: "Ism, familiya, telefon raqam va ORCID iD. Raqamingizni Telegram bot tasdiqlaydi, parol kerak emas.",
  },
  {
    title: "Maqolani yuklang",
    text: "PDF fayl, annotatsiya, kalit so‘zlar va hammualliflar haqida ma’lumot.",
  },
  {
    title: "Biz joylaymiz",
    text: "Maqola qaysi platformada joylanganini kabinetingizda kuzatib borasiz.",
  },
];

export default function HomePage() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Wordmark />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Asosiy">
          <Link href="/login" className="btn btn-ghost">
            Kirish
          </Link>
          <Link href="/register" className="btn btn-primary hidden sm:inline-flex">
            Ro‘yxatdan o‘tish
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <section className="grid items-center gap-14 py-10 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <h1 className="max-w-xl font-serif text-[2.5rem] leading-[1.06] font-semibold tracking-tight sm:text-6xl">
              Maqola yozing — biz joylab beramiz
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted">
              Universitet o‘qituvchilari uchun. Maqolani bir marta yuklaysiz, biz uni ilmiy
              platformalarga joylaymiz va avval chop etilgan barcha maqolalaringizni ORCID iD
              orqali bir ro‘yxatga yig‘amiz.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn btn-primary btn-lg">
                Ro‘yxatdan o‘tish
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg">
                Akkauntim bor, kirish
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              Kirish parolsiz: tasdiqlash kodi Telegram botimizdan keladi.
            </p>
          </div>
          <Manuscript />
        </section>

        <section aria-labelledby="how-title" className="border-t border-line py-14">
          <h2 id="how-title" className="font-serif text-2xl font-semibold">
            Qanday ishlaydi
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="font-serif text-3xl leading-none text-tile" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted sm:px-6">
          Avtomaqola. Universitet o‘qituvchilari uchun xizmat.
        </p>
      </footer>
    </>
  );
}
