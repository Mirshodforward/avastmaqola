import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard/shell";
import { PresenceList } from "@/components/web-presence/presence-list";
import { PresenceSearch } from "@/components/web-presence/presence-search";
import { aiClient } from "@/server/ai/client";
import { requireUser } from "@/server/auth/session";
import { getEditableProfile } from "@/server/profiles/service";
import { getPresence } from "@/server/web-presence/service";

export const metadata: Metadata = { title: "Internetdagi ma’lumotlarim", robots: { index: false } };

export default function WebPresencePage() {
  // Sessiya so‘rov vaqtida o‘qiladi, shuning uchun sahifa Suspense ichida oqim bilan keladi
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <WebPresence />
    </Suspense>
  );
}

/** O‘qituvchining internetdagi ma’lumotlari: oxirgi natija darhol (bazadan), yangi izlash — faqat tugma bilan */
async function WebPresence() {
  const user = await requireUser();
  const [editable, presence] = await Promise.all([getEditableProfile(user.id), getPresence(user.id)]);

  return (
    <DashboardShell admin={user.role === "admin"} moderator={user.role === "moderator"}>
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Internetdagi ma’lumotlarim</h1>
      <p className="mt-3 text-muted">
        {user.firstName} {user.lastName}
        {" · "}
        {user.orcid ? (
          <>ORCID {user.orcid}</>
        ) : (
          <Link href="/dashboard/profile" className="link">
            ORCID iD qo‘shish
          </Link>
        )}
      </p>

      {!editable?.profile ? (
        <p className="mt-8">
          Avval profilni to‘ldiring.{" "}
          <Link href="/dashboard/profile" className="link font-medium">
            Profilni to‘ldirish
          </Link>
        </p>
      ) : aiClient() ? (
        <PresenceSearch again={presence.result !== null} remaining={presence.remaining} running={presence.running} />
      ) : (
        <p className="mt-8 text-muted">Izlash hozircha ishlamaydi.</p>
      )}

      {presence.result && presence.searchedAt && <PresenceList result={presence.result} searchedAt={presence.searchedAt} />}

      <p className="mt-12 text-xs text-muted">Izlash uchun ism, ish joyi va ORCID iD Claude (Anthropic) xizmatiga yuboriladi.</p>
    </DashboardShell>
  );
}
