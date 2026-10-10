"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar } from "@/components/profile/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

/** exact — faqat shu manzil (kabinet bosh sahifasi), aks holda ichki sahifalar ham belgilanadi */
const ITEMS = [
  { href: "/dashboard", label: "Kabinet", exact: true },
  { href: "/dashboard/articles", label: "Maqolalarim" },
  { href: "/dashboard/profile", label: "Profil" },
  { href: "/dashboard/internet", label: "Internetdagi ma’lumotlarim" },
];
const ADMIN = { href: "/admin", label: "Admin panel" };
const MODERATOR = { href: "/moderator", label: "Moderator paneli" };

/**
 * Kabinet header’ining o‘ng tomoni: rasm va ism tugmasi, ochiladigan ro‘yxatda bo‘limlar va "Chiqish".
 * Chiqish tasdiqlash oynasidan keyin: tasodifiy bosish sessiyani yopmasin (qayta kirish Telegram orqali).
 */
export function UserMenu({
  name,
  photoUrl,
  admin,
  moderator,
  compact = false,
}: {
  name: string;
  photoUrl: string | null;
  admin: boolean;
  moderator: boolean;
  /** Ommaviy header: faqat rasm (ism aria-label’da) — u yerda joy tor; kun/tun tugmasi header’ning o‘zida bor */
  compact?: boolean;
}) {
  const pathname = usePathname();
  const items = [...ITEMS, ...(admin ? [ADMIN] : moderator ? [MODERATOR] : [])];
  const current = (item: { href: string; exact?: boolean }) =>
    (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`))
      ? "page"
      : undefined;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const confirm = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();

  // Next oldingi sahifani <Activity> bilan yashiradi (display:none): ochiq modal oyna ko‘rinmay qolib, yangi sahifani
  // bosib bo‘lmas qilardi ("Orqaga"). Yashirilganda effektlar tozalanadi — oyna va ro‘yxat yopiladi
  useLayoutEffect(() => {
    const dialog = confirm.current;
    return () => {
      setOpen(false);
      dialog?.close();
    };
  }, []);

  // Ochiq ro‘yxat tashqariga bosilganda yoki Escape bilan yopiladi
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      // Fokus menyu ichida bo‘lsagina tugmaga qaytadi (boshqa joydagi maydondan tortib olinmaydi)
      if (root.current?.contains(document.activeElement)) trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function askLogout() {
    setOpen(false);
    confirm.current?.showModal();
    // Fokus "Bekor qilish"da: Enter tasodifan chiqarib yubormasin
    cancel.current?.focus();
  }

  return (
    // Tab bilan menyudan chiqilganda yopiladi: ochiq ro‘yxat sahifadagi fokuslangan elementni to‘sib qo‘ymasin
    <div
      ref={root}
      onBlur={(e) => e.relatedTarget && !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
      className="relative"
    >
      {/* Telefonda ism yashirin, shuning uchun tugma nomi aria-label’da */}
      <button
        ref={trigger}
        type="button"
        aria-label={name}
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full border border-line py-1 pr-2 pl-1 transition-colors hover:border-lapis/50 aria-expanded:border-lapis ${compact ? "" : "sm:pr-3"}`}
      >
        <Avatar src={photoUrl} name={name} size={36} />
        {!compact && <span className="hidden max-w-52 truncate text-sm font-medium sm:block">{name}</span>}
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={`size-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        id={`${id}-menu`}
        hidden={!open}
        className="absolute top-full right-0 z-30 mt-2 w-56 rounded-xl border border-line bg-paper p-1.5 shadow-lg shadow-ink/5"
      >
        <nav aria-label="Kabinet">
          <ul role="list">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current(item)}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-mist aria-[current=page]:bg-mist aria-[current=page]:font-medium aria-[current=page]:text-lapis"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Telefonda header qatoriga sig‘maydi (shell.tsx) — shu yerda */}
        {!compact && <ThemeToggle label className="text-sm sm:hidden" />}
        <div className="my-1.5 border-t border-line" />
        <button type="button" onClick={askLogout} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-mist">
          Chiqish
        </button>
      </div>

      <dialog
        ref={confirm}
        aria-labelledby={`${id}-confirm`}
        onClose={() => trigger.current?.focus()}
        // Faqat qoraygan fonga bosish yopadi (oynaning o‘ziga emas)
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-auto w-[min(24rem,calc(100%-2rem))] rounded-2xl border border-line bg-paper p-0 text-ink backdrop:bg-ink/50"
      >
        <div className="p-6">
          <h2 id={`${id}-confirm`} className="font-serif text-xl font-semibold">
            Kabinetdan chiqasizmi?
          </h2>
          <div className="mt-6 flex justify-end gap-3">
            <button ref={cancel} type="button" onClick={() => confirm.current?.close()} className="btn btn-ghost">
              Bekor qilish
            </button>
            <LogoutButton className="btn btn-primary" />
          </div>
        </div>
      </dialog>
    </div>
  );
}
