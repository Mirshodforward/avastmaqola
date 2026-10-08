import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArticleList, type ArticleListEntry } from "@/components/article/article-list";
import { OrcidIcon } from "@/components/orcid-icon";
import { Avatar } from "@/components/profile/avatar";
import { PublicHeader } from "@/components/public-header";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_NAME } from "@/lib/brand";
import { formatDate, truncate } from "@/lib/format";
import { avatarUrl } from "@/lib/media";
import { credentialsLine } from "@/lib/profile-labels";
import { listPublishedByAuthor } from "@/server/articles/public";
import { profilePageJsonLd } from "@/server/profiles/json-ld";
import { PLACEHOLDER_SLUG, getPublicProfile, type PublicProfile } from "@/server/profiles/service";

type Props = PageProps<"/oqituvchi/[slug]">;

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Profil topilmadi", robots: { index: false } };

  const { p, works } = data;
  const name = fullName(p);
  const base = `${credentialsLine(p)}, ${p.institution}. Ilmiy yo‘nalish: ${p.direction}.`;
  const description = truncate(p.bio ? `${base} ${p.bio}` : base, 160);
  const url = `/oqituvchi/${p.slug}`;
  return {
    title: name,
    description,
    alternates: { canonical: url },
    // Sahifadagi openGraph layout’dagini butunlay almashtiradi — sayt nomi va til qayta yoziladi
    openGraph: {
      type: "profile",
      siteName: SITE_NAME,
      locale: "uz_UZ",
      url,
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
  const data = await load(params);
  if (!data) notFound();

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <TeacherProfile {...data} />
      </main>
    </>
  );
}

function TeacherProfile({ p, works }: { p: PublicProfile; works: ArticleListEntry[] }) {
  const name = fullName(p);

  return (
    <article aria-labelledby="teacher-name">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar src={p.photoKey ? avatarUrl(p.photoKey, 512) : null} name={name} size={144} />
        <div className="min-w-0">
          <h1 id="teacher-name" className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {name}
          </h1>
          {p.patronymic && (
            <p className="mt-1 text-sm text-muted">
              {p.lastName} {p.firstName} {p.patronymic}
            </p>
          )}
          <p className="mt-3 text-lg">{credentialsLine(p)}</p>
          <p className="text-muted">{[p.department, p.institution].filter(Boolean).join(", ")}</p>
          <p className="mt-3">
            <span className="text-muted">Ilmiy yo‘nalish:</span> {p.direction}
          </p>
          <IdentityLinks p={p} />
        </div>
      </header>

      {p.bio && (
        <section aria-labelledby="bio-title" className="mt-10 max-w-3xl">
          <h2 id="bio-title" className="font-serif text-xl font-semibold">
            Biografiya
          </h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed">{p.bio}</p>
        </section>
      )}

      {p.keywords.length > 0 && (
        <section aria-labelledby="keywords-title" className="mt-8">
          <h2 id="keywords-title" className="font-serif text-xl font-semibold">
            Ilmiy qiziqishlar
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {p.keywords.map((k) => (
              <li key={k} className="rounded-full border border-line bg-paper px-3 py-1 text-sm">
                {k}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="works-title" className="mt-10">
        <h2 id="works-title" className="font-serif text-xl font-semibold">
          Maqolalar
        </h2>
        {works.length ? (
          <div className="mt-3 max-w-3xl">
            <ArticleList items={works} />
          </div>
        ) : (
          <p className="mt-3 text-muted">Hali chop etilgan maqolalar yo‘q.</p>
        )}
      </section>

      <p className="mt-12 text-xs text-muted">
        Profil yangilangan: <time dateTime={new Date(p.updatedAt).toISOString()}>{formatDate(p.updatedAt)}</time>
      </p>
      <JsonLd data={profilePageJsonLd(p)} />
    </article>
  );
}

function IdentityLinks({ p }: { p: PublicProfile }) {
  const items: { key: string; label: ReactNode; href?: string }[] = [];
  if (p.orcid) {
    items.push({
      key: "orcid",
      href: `https://orcid.org/${p.orcid}`,
      label: (
        <>
          <OrcidIcon /> {p.orcid}
          {!p.orcidVerified && <span className="text-muted"> (tasdiqlanmagan)</span>}
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
  if (p.researcherId) items.push({ key: "wos", label: `Web of Science: ${p.researcherId}` });
  if (p.researchgateUrl) items.push({ key: "rg", href: p.researchgateUrl, label: "ResearchGate" });
  if (p.websiteUrl) items.push({ key: "web", href: p.websiteUrl, label: new URL(p.websiteUrl).hostname });
  if (p.publicEmail) items.push({ key: "email", href: `mailto:${p.publicEmail}`, label: p.publicEmail });
  if (items.length === 0) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-2 text-sm">
      {items.map((item) => (
        <li key={item.key}>
          {item.href ? (
            <a
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 hover:border-muted"
              // Havolalarni o‘qituvchi o‘zi kiritadi va profil moderatsiyasiz ochiladi: universitet domeni
              // spam havolalarga "ovoz" bermasligi uchun ugc nofollow (shaxsni bog‘lash JSON-LD sameAs orqali)
              {...(item.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "me ugc nofollow noopener noreferrer" })}
            >
              {item.label}
            </a>
          ) : (
            <span className="inline-flex items-center rounded-full border border-line bg-paper px-3 py-1">
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
