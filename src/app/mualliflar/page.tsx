import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar } from "@/components/profile/avatar";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { UNIVERSITY_NAME } from "@/lib/brand";
import { avatarUrl } from "@/lib/media";
import { credentialsLine } from "@/lib/profile-labels";
import { listPublicTeachers } from "@/server/profiles/directory";

export const metadata: Metadata = {
  title: "Mualliflar",
  description: `${UNIVERSITY_NAME} mualliflari: lavozimi, ilmiy yo‘nalishi va portaldagi maqolalari.`,
  alternates: { canonical: "/mualliflar" },
};

export default function AuthorsPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Mualliflar</h1>
        <p className="mt-2 text-muted">Portal mualliflarining ochiq profillari. Familiya bo‘yicha tartibda.</p>
        <Suspense fallback={<ListSkeleton />}>
          <Authors />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}

async function Authors() {
  // Ro‘yxat so‘rov vaqtida keshdan olinadi: build bazaga murojaat qilmaydi
  await connection();
  const items = await listPublicTeachers();
  if (items.length === 0) return <p className="mt-8 text-muted">Hali ochiq profillar yo‘q.</p>;

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => {
        const name = `${t.firstName} ${t.lastName}`;
        return (
          <li key={t.slug} className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-start gap-4">
              <Avatar src={t.photoKey ? avatarUrl(t.photoKey, 128) : null} name={name} size={56} />
              <div className="min-w-0">
                <Link href={`/oqituvchi/${t.slug}`} className="font-serif text-lg font-semibold leading-snug hover:text-lapis">
                  {name}
                </Link>
                <p className="mt-1 text-sm text-muted">{credentialsLine(t)}</p>
                {/* Universitet nomi har kartada takrorlanmaydi: faqat boshqa muassasa bo‘lsa yoziladi */}
                {[t.department, t.institution !== UNIVERSITY_NAME ? t.institution : null]
                  .filter((line): line is string => Boolean(line))
                  .map((line) => (
                    <p key={line} className="text-sm text-muted">
                      {line}
                    </p>
                  ))}
              </div>
            </div>
            <p className="mt-4 text-sm">
              <span className="text-muted">Ilmiy yo‘nalish:</span> {t.direction}
            </p>
            {t.published > 0 && <p className="mt-1 text-sm text-muted">{t.published} ta maqola</p>}
          </li>
        );
      })}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <ul aria-label="Yuklanmoqda" className="mt-8 grid animate-pulse gap-4 motion-reduce:animate-none sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <li key={i} className="h-40 rounded-xl border border-line bg-paper" />
      ))}
    </ul>
  );
}
