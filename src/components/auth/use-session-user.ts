"use client";

import { useEffect, useState } from "react";
import { getJson } from "@/lib/api-client";

export type SessionUserSummary = { name: string; photoUrl: string | null; role: string };

// Bir sahifa yuklanishida bitta so‘rov (header va boshqa komponentlar birga ishlatadi). Kirish va chiqish sahifani
// to‘liq qayta yuklaydi — eski javob qolib ketmaydi
let pending: Promise<SessionUserSummary | null> | null = null;

/**
 * Kim kirgan: undefined — hali so‘ralmoqda, null — kirmagan. Ommaviy sahifalar statik (sessiya o‘qilmaydi),
 * shuning uchun buni klient so‘raydi.
 */
export function useSessionUser() {
  const [user, setUser] = useState<SessionUserSummary | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    pending ??= getJson<{ user: SessionUserSummary | null }>("/api/me").then((res) => (res.ok ? res.user : null));
    pending.then((u) => alive && setUser(u));
    return () => {
      alive = false;
    };
  }, []);
  return user;
}
