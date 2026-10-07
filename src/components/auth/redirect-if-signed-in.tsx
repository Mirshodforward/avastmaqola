import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

/** Kirgan foydalanuvchini /login va /register’dan kabinetga yo‘naltiradi. <Suspense> ichida ishlatiladi. */
export async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/dashboard");
  return null;
}
