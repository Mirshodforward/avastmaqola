import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardShell, DashboardSkeleton } from "@/components/dashboard/shell";
import { ProfileForm, type ProfileFormValues } from "@/components/profile/profile-form";
import { UNIVERSITY_NAME } from "@/lib/brand";
import { avatarUrl } from "@/lib/media";
import { requireUser } from "@/server/auth/session";
import { getEditableProfile } from "@/server/profiles/service";

export const metadata: Metadata = { title: "Profilni tahrirlash" };

export default function ProfileEditPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ProfileEditor />
    </Suspense>
  );
}

async function ProfileEditor() {
  const user = await requireUser();
  const data = await getEditableProfile(user.id);
  const p = data?.profile ?? null;

  const initial: ProfileFormValues = {
    firstName: data?.firstName ?? user.firstName,
    lastName: data?.lastName ?? user.lastName,
    patronymic: p?.patronymic ?? "",
    publishedName: p?.publishedName ?? "",
    position: p?.position ?? "",
    academicDegree: p?.academicDegree ?? "",
    academicTitle: p?.academicTitle ?? "",
    institution: p?.institution ?? UNIVERSITY_NAME,
    department: p?.department ?? "",
    direction: p?.direction ?? "",
    bio: p?.bio ?? "",
    keywords: p?.keywords.join(", ") ?? "",
    orcid: data?.orcid ?? "",
    googleScholarUrl: p?.googleScholarUrl ?? "",
    scopusAuthorId: p?.scopusAuthorId ?? "",
    researcherId: p?.researcherId ?? "",
    researchgateUrl: p?.researchgateUrl ?? "",
    websiteUrl: p?.websiteUrl ?? "",
    publicEmail: p?.publicEmail ?? "",
    isPublic: p?.isPublic ?? true,
  };

  return (
    <DashboardShell wide admin={user.role === "admin"}>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Profil</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Olim sifatidagi ma’lumotlaringiz ommaviy sahifangizda va har bir maqolangiz tepasida ko‘rinadi.
        Yulduzcha (*) bilan belgilangan maydonlar majburiy.
      </p>
      <ProfileForm
        initial={initial}
        initialSlug={p?.slug ?? null}
        photoUrl={p?.photoKey ? avatarUrl(p.photoKey, 512) : null}
      />
    </DashboardShell>
  );
}
