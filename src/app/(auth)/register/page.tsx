import type { Metadata } from "next";
import { Suspense } from "react";
import { RedirectIfSignedIn } from "@/components/auth/redirect-if-signed-in";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Ro‘yxatdan o‘tish" };

export default function RegisterPage() {
  return (
    <>
      {/* Cookie o‘qish faqat Suspense ichida — qolgan sahifa statik qobiq sifatida darhol yuklanadi */}
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <RegisterForm />
    </>
  );
}
