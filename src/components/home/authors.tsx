import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar } from "@/components/profile/avatar";
import { avatarUrl } from "@/lib/media";
import { groupByDirection, listPublicTeachers } from "@/server/profiles/directory";
import { HomeSection } from "./home-section";

/** Mualliflar (maqolasi ko‘p birinchi) va ilmiy yo‘nalishlar: qutisiz ro‘yxat. Profil bo‘lmasa chizilmaydi */
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
      <ul className="grid gap-x-10 sm:grid-cols-2">
        {top.map((t) => {
          const name = `${t.firstName} ${t.lastName}`;
          return (
            <li key={t.slug} className="relative flex items-center gap-3 border-t border-line py-3">
              <Avatar src={t.photoKey ? avatarUrl(t.photoKey, 128) : null} name={name} size={44} />
              <span className="min-w-0 flex-1">
                <Link href={`/oqituvchi/${t.slug}`} className="block truncate font-medium after:absolute after:inset-0 hover:text-lapis">
                  {name}
                </Link>
                <span className="block truncate text-sm text-muted">{t.position}</span>
              </span>
              {t.published > 0 && <span className="text-sm whitespace-nowrap text-muted tabular-nums">{t.published} ta maqola</span>}
            </li>
          );
        })}
      </ul>

      <h3 className="mt-12 font-medium">Ilmiy yo‘nalishlar</h3>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        {directions.map((d) => (
          <li key={d.name}>
            <Link href="/yonalishlar" className="border-b border-line pb-0.5 hover:border-lapis hover:text-lapis">
              {d.name}
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
