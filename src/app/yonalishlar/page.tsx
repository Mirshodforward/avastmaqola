import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar } from "@/components/profile/avatar";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { UNIVERSITY_NAME } from "@/lib/brand";
import { avatarUrl } from "@/lib/media";
import { groupByDirection, listPublicTeachers } from "@/server/profiles/directory";

export const metadata: Metadata = {
  title: "Ilmiy yo‘nalishlar",
  description: `${UNIVERSITY_NAME} ilmiy yo‘nalishlari va har bir yo‘nalishdagi mualliflar.`,
  alternates: { canonical: "/yonalishlar" },
};

export default function DirectionsPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Ilmiy yo‘nalishlar</h1>
        <p className="mt-2 text-muted">Portal mualliflari ilmiy yo‘nalishi bo‘yicha. Maqolasi ko‘p yo‘nalishlar birinchi.</p>
        <Suspense fallback={<ListSkeleton />}>
          <Directions />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}

async function Directions() {
  await connection();
  const groups = groupByDirection(await listPublicTeachers());
  if (groups.length === 0) return <p className="mt-8 text-muted">Hali ochiq profillar yo‘q.</p>;

  return (
    <ul className="mt-8 space-y-4">
      {groups.map((g) => (
        <li key={g.name} className="rounded-xl border border-line bg-paper p-5 sm:p-6">
          <h2 className="font-serif text-xl font-semibold">{g.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {g.teachers.length} ta muallif{g.published > 0 && ` · ${g.published} ta maqola`}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {g.teachers.map((t) => {
              const name = `${t.firstName} ${t.lastName}`;
              return (
                <li key={t.slug}>
                  <Link
                    href={`/oqituvchi/${t.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1 text-sm hover:border-lapis"
                  >
                    <Avatar src={t.photoKey ? avatarUrl(t.photoKey, 128) : null} name={name} size={24} />
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <ul aria-label="Yuklanmoqda" className="mt-8 animate-pulse space-y-4 motion-reduce:animate-none">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-32 rounded-xl border border-line bg-paper" />
      ))}
    </ul>
  );
}
