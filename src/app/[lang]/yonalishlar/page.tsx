import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { langAlternates, localePath } from "@/i18n/lang";
import { directionsPageText } from "@/i18n/page-yonalishlar";
import { pageLang } from "@/i18n/server";
import { UNIVERSITY_NAME } from "@/lib/brand";
import type { Lang } from "@/lib/langs";
import { groupByDirection, listPublicTeachers } from "@/server/profiles/directory";

type Props = PageProps<"/[lang]/yonalishlar">;

// Til (params) Suspense’dan tashqarida o‘qiladi ([lang]/layout.tsx’da ham): o‘tish tayyor statik javobni kutadi
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const t = directionsPageText[lang];
  return {
    title: t.title,
    description: t.description(UNIVERSITY_NAME),
    alternates: langAlternates(lang, "/yonalishlar"),
  };
}

export default async function DirectionsPage({ params }: Props) {
  const lang = await pageLang(params);
  const t = directionsPageText[lang];
  return (
    <>
      <PublicHeader />
      <main className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.title}</h1>
        <Suspense fallback={<ListSkeleton label={t.loading} />}>
          <Directions lang={lang} />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}

async function Directions({ lang }: { lang: Lang }) {
  await connection();
  const groups = groupByDirection(await listPublicTeachers());
  const text = directionsPageText[lang];
  if (groups.length === 0) return <p className="mt-8 text-muted">{text.empty}</p>;

  // Yo‘nalish — qator (bosh sahifadagi yangiliklar kabi chiziq bilan ajratilgan), mualliflar — bosh sahifadagi pillalar.
  // #langar qo‘yilmaydi: ro‘yxat Suspense ichida keyin keladi, ilova ichidagi o‘tishda langar hali yo‘q bo‘lib qolishi mumkin.
  // Yo‘nalish nomi — o‘qituvchi o‘zbekcha yozgan matn (lang="uz": boshqa tildagi sahifada to‘g‘ri talaffuz)
  return (
    <ul role="list" className="mt-8 divide-y divide-line border-y border-line">
      {groups.map((g) => (
        <li key={g.name} className="grid gap-x-8 gap-y-3 py-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div>
            <h2 lang="uz" className="font-serif text-lg leading-snug font-semibold">{g.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {text.authors(g.teachers.length)}
              {g.published > 0 && ` · ${text.articles(g.published)}`}
            </p>
          </div>
          <ul role="list" className="flex flex-wrap content-start gap-2">
            {g.teachers.map((t) => (
              <li key={t.slug}>
                <Link
                  href={localePath(lang, `/oqituvchi/${t.slug}`)}
                  className="inline-block rounded-full border border-line bg-paper px-4 py-2 text-sm transition-colors hover:border-lapis hover:text-lapis"
                >
                  {`${t.firstName} ${t.lastName}`}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton({ label }: { label: string }) {
  return (
    <ul aria-label={label} className="mt-8 animate-pulse divide-y divide-line border-y border-line motion-reduce:animate-none">
      {[0, 1, 2].map((i) => (
        <li key={i} className="py-6">
          <div className="h-6 w-56 rounded bg-line" />
          <div className="mt-3 h-9 w-40 rounded-full bg-line" />
        </li>
      ))}
    </ul>
  );
}
