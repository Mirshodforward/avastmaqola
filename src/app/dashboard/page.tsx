import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { OrcidIcon } from "@/components/orcid-icon";
import { Wordmark } from "@/components/wordmark";
import { formatUzPhone } from "@/lib/validation";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Kabinet" };

export default function DashboardPage() {
  // Sessiya so‘rov vaqtida o‘qiladi, shuning uchun kabinet Suspense ichida oqim bilan keladi
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireUser();

  return (
    <Shell aside={<span className="hidden text-muted sm:inline">{user.firstName} {user.lastName}</span>}>
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        Xush kelibsiz, {user.firstName}!
      </h1>

      <dl className="mt-6 grid gap-x-10 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted">Telefon</dt>
        <dd>{formatUzPhone(user.phone)}</dd>
        <dt className="text-muted">ORCID iD</dt>
        <dd className="flex flex-wrap items-center gap-2">
          <OrcidIcon />
          <a className="link" href={`https://orcid.org/${user.orcid}`} target="_blank" rel="noopener noreferrer">
            {user.orcid}
          </a>
          {!user.orcidVerified && (
            <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
              egalik hali tasdiqlanmagan
            </span>
          )}
        </dd>
      </dl>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="works-title" className="rounded-xl border border-line bg-paper p-6">
          <h2 id="works-title" className="font-serif text-xl font-semibold">
            Mening maqolalarim
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            ORCID iD bo‘yicha ORCID, OpenAlex, Crossref va Zenodo’dan maqolalaringizni yig‘amiz,
            takrorlarini birlashtiramiz va bitta ro‘yxatda ko‘rsatamiz.
          </p>
          <button type="button" className="btn btn-primary mt-5" disabled>
            Maqolalarimni qidirish
          </button>
          <p className="mt-2 text-xs text-muted">Keyingi bosqichda ishga tushadi.</p>
        </section>

        <section aria-labelledby="publish-title" className="rounded-xl border border-dashed border-line p-6">
          <h2 id="publish-title" className="font-serif text-xl font-semibold">
            Yangi maqola joylash
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            PDF va ma’lumotlarni bir marta kiritasiz: Zenodo’da DOI olamiz va maqolani Google Scholar
            indekslaydigan sahifada chop etamiz.
          </p>
          <button type="button" className="btn btn-secondary mt-5" disabled>
            Maqola yuklash
          </button>
          <p className="mt-2 text-xs text-muted">Keyingi bosqichda ishga tushadi.</p>
        </section>
      </div>
    </Shell>
  );
}

function Shell({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Wordmark />
          <div className="flex items-center gap-3 text-sm">
            {aside}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">{children}</main>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <Shell>
      <div className="animate-pulse space-y-4 motion-reduce:animate-none" aria-label="Yuklanmoqda">
        <div className="h-9 w-72 rounded bg-line" />
        <div className="h-4 w-56 rounded bg-line" />
        <div className="h-4 w-64 rounded bg-line" />
      </div>
    </Shell>
  );
}
