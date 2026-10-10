import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar } from "@/components/profile/avatar";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { langAlternates, localePath } from "@/i18n/lang";
import { authorsPageText } from "@/i18n/page-mualliflar";
import { pageLang } from "@/i18n/server";
import { UNIVERSITY_NAME } from "@/lib/brand";
import type { Lang } from "@/lib/langs";
import { avatarUrl } from "@/lib/media";
import { credentialsLine } from "@/lib/profile-labels";
import { listPublicTeachers } from "@/server/profiles/directory";

type Props = PageProps<"/[lang]/mualliflar">;

// generateMetadata va sahifa til params’ini o‘qiydi — instant tekshiruvi o‘chiq (bosh sahifadagi kabi)
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const t = authorsPageText[lang];
  return { title: t.title, description: t.description(UNIVERSITY_NAME), alternates: langAlternates(lang, "/mualliflar") };
}

export default async function AuthorsPage({ params }: Props) {
  const lang = await pageLang(params);
  const t = authorsPageText[lang];
  return (
    <>
      <PublicHeader />
      <main className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.title}</h1>
        <Suspense fallback={<ListSkeleton label={t.loading} />}>
          <Authors lang={lang} />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}

async function Authors({ lang }: { lang: Lang }) {
  // Ro‘yxat so‘rov vaqtida keshdan olinadi: build bazaga murojaat qilmaydi
  await connection();
  const items = await listPublicTeachers();
  const text = authorsPageText[lang];
  if (items.length === 0) return <p className="mt-8 text-muted">{text.empty}</p>;

  // Bosh sahifadagi muallif kartalari bilan bir xil: chapda rasm paneli, o‘ngda ism, lavozim, yo‘nalish va maqolalar soni.
  // Yo‘nalish — o‘qituvchi o‘zbekcha yozgan matn (lang="uz"); lavozim qatorida daraja sahifa tilida, shuning uchun belgilanmaydi
  return (
    <ul role="list" className="mt-8 grid gap-4 lg:grid-cols-2">
      {items.map((t) => {
        const name = `${t.firstName} ${t.lastName}`;
        const credentials = credentialsLine(t, lang);
        return (
          // Havola faqat ismda, bosiladigan joy butun karta (after); fokus halqasi butun karta atrofida
          <li
            key={t.slug}
            className="group relative flex overflow-hidden rounded-xl border border-line bg-paper transition-colors hover:border-lapis/50 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-tile"
          >
            <div className="grid w-28 shrink-0 place-items-center border-r border-line bg-mist sm:w-32">
              <Avatar src={t.photoKey ? avatarUrl(t.photoKey, 128) : null} name={name} size={64} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
              <div>
                <h2 className="font-serif text-lg leading-snug font-semibold">
                  <Link href={localePath(lang, `/oqituvchi/${t.slug}`)} className="group-hover:text-lapis after:absolute after:inset-0 focus-visible:outline-none!">
                    {name}
                  </Link>
                </h2>
                {credentials && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{credentials}</p>}
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-line pt-3 text-sm">
                <p lang="uz" className="line-clamp-2 text-muted">
                  {t.direction}
                </p>
                {t.published > 0 && <p className="shrink-0 font-medium whitespace-nowrap text-lapis tabular-nums">{text.articles(t.published)}</p>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ListSkeleton({ label }: { label: string }) {
  return (
    <ul aria-label={label} className="mt-8 grid animate-pulse gap-4 motion-reduce:animate-none lg:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="h-32 rounded-xl border border-line bg-paper" />
      ))}
    </ul>
  );
}
