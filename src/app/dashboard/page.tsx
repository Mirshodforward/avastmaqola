import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewArticleButton } from "@/components/article/new-article-button";
import { StatusChip } from "@/components/article/status-chip";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard/shell";
import { OrcidIcon } from "@/components/orcid-icon";
import { Avatar } from "@/components/profile/avatar";
import { ARTICLE_STATUSES, STATUS_LABELS, titleIn, type ArticleStatus } from "@/lib/article-rules";
import { formatDate } from "@/lib/format";
import { avatarUrl } from "@/lib/media";
import { formatUzPhone } from "@/lib/validation";
import { listOwnArticles } from "@/server/articles/service";
import { requireUser } from "@/server/auth/session";
import { getEditableProfile } from "@/server/profiles/service";

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
  const [editable, articles] = await Promise.all([getEditableProfile(user.id), listOwnArticles(user.id)]);
  const profile = editable?.profile ?? null;
  const name = `${user.firstName} ${user.lastName}`;
  const count = (s: ArticleStatus) => articles.filter((a) => a.status === s).length;

  // Yo‘l xaritasi: birinchi bajarilmagan bosqich — "hozirgi qadam"
  const steps = [
    {
      title: "Profilni to‘ldiring",
      text: "Rasm, lavozim, ilmiy yo‘nalish va muassasa — maqola sahifasining tepasida ko‘rinadi.",
      done: profile !== null,
      action: (
        <Link href="/dashboard/profile" className="btn btn-primary">
          Profilni to‘ldirish
        </Link>
      ),
    },
    {
      title: "Maqola qo‘shing",
      text: "PDF hamda o‘zbek, rus va ingliz tilida sarlavha, annotatsiya va kalit so‘zlar.",
      done: articles.length > 0,
      action: <NewArticleButton />,
    },
    {
      title: "Ko‘rib chiqishga yuboring",
      text: "Universitet xodimi tekshiradi, natija Telegram’ga keladi.",
      done: articles.some((a) => a.status !== "draft"),
      action: null,
    },
    {
      title: "Maqola chop etiladi",
      text: "Alohida ommaviy sahifa, Google Scholar uchun moslangan.",
      done: count("published") > 0,
      action: null,
    },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <DashboardShell wide admin={user.role === "admin"} moderator={user.role === "moderator"}>
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Xush kelibsiz, {user.firstName}!</h1>
      {current >= 0 && (
        <p className="mt-2 text-muted">
          Keyingi qadam: <span className="font-medium text-ink">{steps[current].title.toLowerCase()}</span>
        </p>
      )}

      {current >= 0 && (
        <section aria-labelledby="roadmap-title" className="mt-8 rounded-xl border border-line bg-paper p-6">
          <h2 id="roadmap-title" className="sr-only">
            Maqolani joylash bosqichlari
          </h2>
          <ol className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, i) => {
              const isCurrent = i === current;
              return (
                <li key={step.title} aria-current={isCurrent ? "step" : undefined} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                      step.done
                        ? "bg-tile text-paper"
                        : isCurrent
                          ? "bg-lapis text-on-lapis ring-4 ring-lapis/15"
                          : "border border-line text-muted"
                    }`}
                  >
                    {step.done ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={`font-medium ${step.done ? "text-muted line-through decoration-line" : ""}`}>
                      {step.title}
                      {step.done && <span className="sr-only"> — bajarildi</span>}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
                    {isCurrent && step.action && <div className="mt-3">{step.action}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr] 2xl:grid-cols-[2fr_1fr]">
        <section aria-labelledby="articles-title" className="rounded-xl border border-line bg-paper p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="articles-title" className="font-serif text-xl font-semibold">
              Maqolalarim
            </h2>
            {articles.length > 0 && <NewArticleButton />}
          </div>
          {articles.length > 0 && (
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ARTICLE_STATUSES.map((s) => (
                <div key={s} className="rounded-lg bg-mist px-4 py-3">
                  <dt className="text-xs text-muted">{STATUS_LABELS[s]}</dt>
                  <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">{count(s)}</dd>
                </div>
              ))}
            </dl>
          )}
          {articles.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-line px-6 py-8 text-center">
              <p className="font-medium">Hali maqola yo‘q</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                Universitet tasdiqlagach, maqola alohida sahifada hammaga ochiq bo‘ladi.
              </p>
              <ul className="mx-auto mt-5 grid max-w-md gap-2 text-left text-sm">
                {[
                  "Maqolaning PDF fayli (10 MB gacha)",
                  "O‘zbek, rus va ingliz tilida sarlavha",
                  "Uch tilda annotatsiya (kamida 300 belgi)",
                  "Uch tilda 3–10 ta kalit so‘z",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-0.5 text-tile">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-center">
                <NewArticleButton />
              </div>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {articles.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/dashboard/articles/${a.id}`} className="min-w-0 font-medium hover:text-lapis">
                      {titleIn(a)}
                    </Link>
                    <StatusChip status={a.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    №{a.id} · o‘zgartirilgan: {formatDate(a.updatedAt)}
                  </p>
                  {a.status === "rejected" && a.reviewNote && (
                    <p className="mt-1 text-sm text-danger">Izoh: {a.reviewNote}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="profile-title" className="rounded-xl border border-line bg-paper p-6">
          <div className="flex items-center gap-4">
            <Avatar src={profile?.photoKey ? avatarUrl(profile.photoKey, 128) : null} name={name} size={64} />
            <div className="min-w-0">
              <h2 id="profile-title" className="font-serif text-xl font-semibold">
                {name}
              </h2>
              <p className="text-sm text-muted">
                {profile ? `${profile.position}, ${profile.institution}` : "Profil hali to‘ldirilmagan"}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted">Telefon</dt>
            <dd>{formatUzPhone(user.phone)}</dd>
            <dt className="text-muted">ORCID iD</dt>
            <dd className="flex flex-wrap items-center gap-2">
              {user.orcid ? (
                <>
                  <OrcidIcon />
                  <a className="link" href={`https://orcid.org/${user.orcid}`} target="_blank" rel="noopener noreferrer">
                    {user.orcid}
                  </a>
                  {!user.orcidVerified && (
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                      egalik hali tasdiqlanmagan
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted">Qo‘shilmagan, profil tahririda kiritiladi</span>
              )}
            </dd>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard/profile" className="btn btn-primary">
              {profile ? "Profilni tahrirlash" : "Profilni to‘ldirish"}
            </Link>
            {/* Oddiy <a>: router keshidagi (saqlashdan oldingi) eski nusxa emas, yangi sahifa ochilsin */}
            {profile?.isPublic && (
              <a href={`/oqituvchi/${profile.slug}`} className="btn btn-secondary">
                Ommaviy sahifa
              </a>
            )}
          </div>
          {!profile && (
            <p className="mt-4 rounded-lg border border-lapis/25 bg-mist px-4 py-3 text-sm leading-relaxed">
              Maqolani yuborish uchun profil kerak: rasmingiz, ilmiy yo‘nalishingiz va muassasangiz maqola
              sahifasining tepasida ko‘rinadi.
            </p>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
