import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar } from "@/components/profile/avatar";
import { homeText } from "@/i18n/home";
import { localePath } from "@/i18n/lang";
import type { Lang } from "@/lib/langs";
import { avatarUrl } from "@/lib/media";
import { credentialsLine } from "@/lib/profile-labels";
import { groupByDirection, listPublicTeachers } from "@/server/profiles/directory";
import { HomeSection } from "./home-section";
import { seq } from "./motion";

/**
 * Mualliflar: maqola kartalari bilan bir xil gorizontal kartochkalar (chapda rasm paneli, o‘ngda ism, lavozim,
 * yo‘nalish va maqolalar soni), maqolasi ko‘p mualliflar birinchi. Ostida ilmiy yo‘nalishlar. Profil bo‘lmasa chizilmaydi.
 */
export function HomeAuthors({ lang }: { lang: Lang }) {
  return (
    <Suspense fallback={null}>
      <Authors lang={lang} />
    </Suspense>
  );
}

async function Authors({ lang }: { lang: Lang }) {
  await connection();
  const teachers = await listPublicTeachers();
  if (teachers.length === 0) return null;
  // 6 ta: ikki ustunli to‘rda to‘liq 3 qator (maqola kartalari bilan bir xil ritm)
  const top = [...teachers].sort((a, b) => b.published - a.published).slice(0, 6);
  const directions = groupByDirection(teachers).slice(0, 10);
  const t = homeText[lang].authors;

  // Lavozim va yo‘nalish — o‘qituvchi o‘zbekcha yozgan matn (lang="uz": boshqa tildagi sahifada to‘g‘ri talaffuz)
  return (
    <HomeSection
      id="authors-title"
      title={t.title}
      stacked
      action={
        <Link href={localePath(lang, "/mualliflar")} className="link">
          {t.all}
        </Link>
      }
    >
      <ul role="list" className="grid gap-4 lg:grid-cols-2">
        {top.map((a, i) => {
          const name = `${a.firstName} ${a.lastName}`;
          return (
            // Havola faqat ismda, bosiladigan joy butun karta (after); fokus halqasi butun karta atrofida.
            // Harakat: karta o‘z o‘rniga kirganda ko‘tariladi (qatordagi ikkinchisi biroz kechikib)
            <li
              key={a.slug}
              style={seq(i % 2)}
              className="m-rise group relative flex overflow-hidden rounded-xl border border-line bg-paper transition-colors hover:border-lapis/50 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-tile"
            >
              <div className="grid w-28 shrink-0 place-items-center border-r border-line bg-mist sm:w-32">
                <Avatar src={a.photoKey ? avatarUrl(a.photoKey, 128) : null} name={name} size={64} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
                <div>
                  <h3 className="font-serif text-lg leading-snug font-semibold">
                    <Link href={localePath(lang, `/oqituvchi/${a.slug}`)} className="group-hover:text-lapis after:absolute after:inset-0 focus-visible:outline-none!">
                      {name}
                    </Link>
                  </h3>
                  <p lang="uz" className="mt-0.5 line-clamp-2 text-sm text-muted">
                    {credentialsLine(a, lang)}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-3 border-t border-line pt-3 text-sm">
                  <p lang="uz" className="line-clamp-2 text-muted">
                    {a.direction}
                  </p>
                  {a.published > 0 && (
                    <p className="shrink-0 font-medium whitespace-nowrap text-lapis tabular-nums">{t.articleCount(a.published)}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-12 font-medium">{t.directions}</h3>
      <ul role="list" lang="uz" className="mt-4 flex flex-wrap gap-2">
        {directions.map((d) => (
          <li key={d.name}>
            <Link
              href={localePath(lang, "/yonalishlar")}
              className="inline-block rounded-full border border-line bg-paper px-4 py-2 text-sm transition-colors hover:border-lapis hover:text-lapis"
            >
              {d.name}
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
