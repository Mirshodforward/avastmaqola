import type { ReactNode } from "react";
import { UserMenu } from "@/components/dashboard/user-menu";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { SiteBrand } from "@/components/site-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { avatarUrl } from "@/lib/media";
import { getCurrentUser } from "@/server/auth/session";
import { getProfilePhotoKey } from "@/server/profiles/service";

/** Keng sahifalar (muharrir: chapda AI, o‘ngda forma) — header va kontent birga kengayadi, chap cheti bir chiziqda */
const WIDE = "w-full px-4 sm:px-6 lg:px-10";

/**
 * Kabinet, admin va moderator sahifalari. Header — ommaviy sahifalardagi bilan bir xil: chapda portal nomi,
 * o‘ngda o‘qituvchining rasmi va ismi (bosilganda bo‘limlar va "Chiqish"); en ham ommaviy sahifalarniki (PUBLIC_WIDTH).
 * admin / moderator — menyuga panel havolasi (sahifa foydalanuvchi rolini o‘zi biladi; skelet uchun kerak emas).
 * wide — kontent ekranning butun kengligiga yoyiladi.
 */
export function DashboardShell({
  admin = false,
  moderator = false,
  wide = false,
  children,
}: {
  admin?: boolean;
  moderator?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Frame wide={wide} user={<HeaderUser admin={admin} moderator={moderator} />}>
      {children}
    </Frame>
  );
}

/** Sahifa sessiyani allaqachon o‘qigan (getCurrentUser so‘rov ichida keshlanadi) — bu yerda faqat rasm kaliti */
async function HeaderUser({ admin, moderator }: { admin: boolean; moderator: boolean }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const photoKey = await getProfilePhotoKey(user.id);
  return (
    <UserMenu
      name={`${user.firstName} ${user.lastName}`}
      photoUrl={photoKey ? avatarUrl(photoKey, 128) : null}
      admin={admin}
      moderator={moderator}
    />
  );
}

function Frame({ wide = false, user, children }: { wide?: boolean; user: ReactNode; children: ReactNode }) {
  const frame = wide ? WIDE : PUBLIC_WIDTH;
  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className={`flex items-center justify-between gap-4 py-3 ${frame}`}>
          <SiteBrand />
          <div className="flex items-center gap-2">
            {/* Telefonda qatorga sig‘maydi — foydalanuvchi menyusi ichida */}
            <ThemeToggle className="hidden sm:inline-flex" />
            {user}
          </div>
        </div>
      </header>
      <main className={`flex-1 py-10 ${frame}`}>{children}</main>
    </>
  );
}

/**
 * Suspense fallback’i: sessiya hali o‘qilmagan, foydalanuvchi tugmasi o‘rnida o‘sha o‘lchamdagi doira.
 * wide — sahifa keng ochilsa, header yuklanish tugaganda yon tomonga sakramasin.
 */
export function DashboardSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <Frame wide={wide} user={<span className="size-11.5 rounded-full bg-line" />}>
      <div className="animate-pulse space-y-4 motion-reduce:animate-none" aria-label="Yuklanmoqda">
        <div className="h-9 w-72 rounded bg-line" />
        <div className="h-4 w-56 rounded bg-line" />
        <div className="h-4 w-64 rounded bg-line" />
      </div>
    </Frame>
  );
}
