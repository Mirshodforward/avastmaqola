"use client";

import { useState } from "react";
import { postJson } from "@/lib/api-client";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await postJson("/api/auth/logout");
    // To‘liq yuklash: brauzer xotirasida kabinet sahifasi qolmasin, "orqaga" ham unga qaytarmasin
    window.location.replace("/");
  }

  return (
    <button type="button" onClick={logout} disabled={pending} className="btn btn-ghost">
      {pending ? "Chiqilmoqda…" : "Chiqish"}
    </button>
  );
}
