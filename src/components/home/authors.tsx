import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar } from "@/components/profile/avatar";
import { avatarUrl } from "@/lib/media";
import { groupByDirection, listPublicTeachers } from "@/server/profiles/directory";
import { HomeSection } from "./home-section";

/** Mualliflar va ilmiy yo‘nalishlar: eng faollari (maqolasi ko‘p) birinchi. Profil bo‘lmasa chizilmaydi */
export function HomeAuthors() {
  return (
    <Suspense fallback={null}>
      <Authors />
    </Suspense>
  );
}

async function Authors() {
  await connection();
  const teachers = await listPublicTeachers();
  if (teachers.length === 0) return null;
  const top = [...teachers].sort((a, b) => b.published - a.published).slice(0, 8);
  const directions = groupByDirection(teachers).slice(0, 10);

  return (
    <HomeSection
      id="authors-title"
      title="Mualliflar"
      action={
        <Link href="/mualliflar" className="link">
          Barcha mualliflar
        </Link>
      }
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {top.map((t) => {
          const name = `${t.firstName} ${t.lastName}`;
          return (
            <li key={t.slug}>
              <Link
                href={`/oqituvchi/${t.slug}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3 hover:border-lapis/50"
              >
                <Avatar src={t.photoKey ? avatarUrl(t.photoKey, 128) : null} name={name} size={48} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{name}</span>
                  <span className="block truncate text-sm text-muted">{t.position}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-10 font-medium">Ilmiy yo‘nalishlar</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {directions.map((d) => (
          <li key={d.name}>
            <Link href="/yonalishlar" className="inline-block rounded-full border border-line bg-paper px-3 py-1.5 text-sm hover:border-lapis">
              {d.name}
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
