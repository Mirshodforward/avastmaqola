import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArticleList, type ArticleListEntry } from "@/components/article/article-list";
import { OrcidIcon } from "@/components/orcid-icon";
import { Avatar } from "@/components/profile/avatar";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { JsonLd } from "@/components/seo/json-ld";
import { langAlternates, localePath } from "@/i18n/lang";
import { teacherPageText } from "@/i18n/page-oqituvchi";
import { pageLang } from "@/i18n/server";
import { SITE_NAME } from "@/lib/brand";
import { truncate } from "@/lib/format";
import type { Lang } from "@/lib/langs";
import { avatarUrl } from "@/lib/media";
import { credentialsLine } from "@/lib/profile-labels";
import { listPublishedByAuthor } from "@/server/articles/public";
import { profilePageJsonLd } from "@/server/profiles/json-ld";
import { PLACEHOLDER_SLUG, getPublicProfile, type PublicProfile } from "@/server/profiles/service";

type Props = PageProps<"/[lang]/oqituvchi/[slug]">;

// Sahifa to‘liq statik: yangi profilga birinchi so‘rov ham tayyor HTML oladi, yo‘q profil — haqiqiy 404.
// generateStaticParams’dagi o‘rinbosar build bazaga murojaat qilmasligi uchun (Cache Components kamida bitta param talab qiladi).
export const ensureStatic = "navigation";
export const instant = false; // params Suspense’dan tashqarida: o‘tish tayyor statik javobni kutadi

export async function generateStaticParams() {
  return [{ slug: PLACEHOLDER_SLUG }];
}

async function load(params: Props["params"]) {
  const p = await getPublicProfile((await params).slug);
  return p ? { p, works: await listPublishedByAuthor(p.userId) } : null;
}

const fullName = (p: PublicProfile) => `${p.firstName} ${p.lastName}`;

const OG_LOCALE = { uz: "uz_UZ", ru: "ru_RU", en: "en_US" } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const t = teacherPageText[lang];
  const data = await load(params);
  if (!data) return { title: t.notFound, robots: { index: false } };

  const { p, works } = data;
  const name = fullName(p);
  const base = t.description(credentialsLine(p, lang), p.institution, p.direction);
  const description = truncate(p.bio ? `${base} ${p.bio}` : base, 160);
  const path = `/oqituvchi/${p.slug}`;
  return {
    title: name,
    description,
    alternates: langAlternates(lang, path),
    // Sahifadagi openGraph layout’dagini butunlay almashtiradi — sayt nomi va til qayta yoziladi
    openGraph: {
      type: "profile",
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
      url: localePath(lang, path),
      title: name,
      description,
      firstName: p.firstName,
      lastName: p.lastName,
      images: p.photoKey ? [{ url: avatarUrl(p.photoKey, 512), width: 512, height: 512, alt: name }] : undefined,
    },
    // Maqolasiz profil — "yupqa" sahifa: indekslanmaydi (sitemap’ga ham kirmaydi), havolalari kuzatiladi
    robots: works.length ? undefined : { index: false, follow: true },
  };
}

export default async function TeacherPage({ params }: Props) {
  const lang = await pageLang(params);
  const data = await load(params);
  if (!data) notFound();
  const t = teacherPageText[lang];

  return (
    <>
      <PublicHeader />
      <main className={`flex-1 py-10 ${PUBLIC_WIDTH}`}>
        {/* Bo‘lim havolasi: yangilik sahifasidagi bilan bir xil; py-1 — bosish maydoni kamida 24px (keksa foydalanuvchilar) */}
        <nav aria-label={t.breadcrumb} className="text-sm">
          <Link href={localePath(lang, "/mualliflar")} className="link inline-block py-1">
            {t.authors}
          </Link>
        </nav>
        <TeacherProfile {...data} lang={lang} />
      </main>
      <PublicFooter />
    </>
  );
}

function TeacherProfile({ p, works, lang }: { p: PublicProfile; works: ArticleListEntry[]; lang: Lang }) {
  const t = teacherPageText[lang];
  const name = fullName(p);
  const credentials = credentialsLine(p, lang);
  // Lavozim — o‘qituvchi yozgan o‘zbekcha matn (lang="uz"), ilmiy daraja — sahifa tilida
  const degree = credentialsLine({ position: null, academicDegree: p.academicDegree }, lang);
  // Kafedra yo‘nalish bilan bir xil yozilgan bo‘lsa, ikki marta ko‘rsatilmaydi
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const department = p.department && !same(p.department, p.direction) ? p.department : null;

  // Profil yangilangan sana sahifada yozilmaydi: JSON-LD’da (dateModified) bor.
  // Kafedra, muassasa, yo‘nalish, qiziqishlar va biografiya — o‘qituvchi yozgan matn: boshqa tildagi sahifada ham lang="uz"
  return (
    <article aria-labelledby="teacher-name" className="mt-4">
      <header>
        {/* Rasm ism yonida: telefonda ham alohida qator egallamaydi */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Avatar src={p.photoKey ? avatarUrl(p.photoKey, 512) : null} name={name} size={80} />
          <div className="min-w-0">
            <h1 id="teacher-name" className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {name}
            </h1>
            {p.patronymic && (
              <p className="mt-1 text-sm text-muted">
                {p.lastName} {p.firstName} {p.patronymic}
              </p>
            )}
            {credentials && (
              <p className="mt-1 text-lg">
                <span lang="uz">{p.position}</span>
                {degree && `, ${degree}`}
              </p>
            )}
          </div>
        </div>
        <p lang="uz" className="mt-5 text-muted">{[department, p.institution].filter(Boolean).join(", ")}</p>
        {/* Bosh sahifadagi yo‘nalish pillalari kabi /yonalishlar ga (u yerda ro‘yxat keyin keladi — #langarsiz) */}
        <p className="mt-1">
          <span className="text-muted">{t.direction}</span>{" "}
          <Link href={localePath(lang, "/yonalishlar")} lang="uz" className="link">
            {p.direction}
          </Link>
        </p>
        {/* Qiziqishlar havola emas — oddiy matn (pilla bosh sahifada havola ma’nosida) */}
        {p.keywords.length > 0 && (
          <p className="mt-1">
            <span className="text-muted">{t.interests}</span> <span lang="uz">{p.keywords.join(", ")}</span>
          </p>
        )}
        <IdentityLinks p={p} lang={lang} />
      </header>

      {p.bio && (
        <section aria-labelledby="bio-title" className="mt-12 border-t border-line pt-8">
          <h2 id="bio-title" className="font-serif text-2xl font-semibold tracking-tight">
            {t.bio}
          </h2>
          {/* ~75 belgili qator (Onest’da max-w-prose ~95 belgi berardi) */}
          <p lang="uz" className="mt-4 max-w-[34em] whitespace-pre-line leading-relaxed">{p.bio}</p>
        </section>
      )}

      <section aria-labelledby="works-title" className="mt-12 border-t border-line pt-8">
        <h2 id="works-title" className="font-serif text-2xl font-semibold tracking-tight">
          {t.works}
        </h2>
        {works.length ? (
          <div className="mt-4">
            <ArticleList items={works} withYear lang={lang} />
          </div>
        ) : (
          <p className="mt-4 text-muted">{t.noWorks}</p>
        )}
      </section>
      <JsonLd data={profilePageJsonLd(p)} />
    </article>
  );
}

function IdentityLinks({ p, lang }: { p: PublicProfile; lang: Lang }) {
  const items: { key: string; label: ReactNode; href?: string }[] = [];
  if (p.orcid) {
    items.push({
      key: "orcid",
      href: `https://orcid.org/${p.orcid}`,
      label: (
        <>
          <OrcidIcon /> {p.orcid}
          {!p.orcidVerified && <span className="text-muted"> {teacherPageText[lang].orcidUnverified}</span>}
        </>
      ),
    });
  }
  if (p.googleScholarUrl) items.push({ key: "scholar", href: p.googleScholarUrl, label: "Google Scholar" });
  if (p.scopusAuthorId) {
    items.push({
      key: "scopus",
      href: `https://www.scopus.com/authid/detail.uri?authorId=${p.scopusAuthorId}`,
      label: `Scopus: ${p.scopusAuthorId}`,
    });
  }
  if (items.length === 0) return null;

  // Bosh sahifadagi havola pillalari bilan bir xil o‘lcham va hover
  return (
    <ul role="list" className="mt-5 flex flex-wrap gap-2 text-sm">
      {items.map((item) => (
        <li key={item.key}>
          {item.href ? (
            <a
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2 transition-colors hover:border-lapis hover:text-lapis"
              // Havolalarni o‘qituvchi o‘zi kiritadi va profil moderatsiyasiz ochiladi: universitet domeni
              // spam havolalarga "ovoz" bermasligi uchun ugc nofollow (shaxsni bog‘lash JSON-LD sameAs orqali)
              {...(item.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "me ugc nofollow noopener noreferrer" })}
            >
              {item.label}
            </a>
          ) : (
            <span className="inline-flex items-center rounded-full border border-line bg-paper px-4 py-2">
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
