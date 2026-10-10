import type { Metadata } from "next";
import { NotFoundBody } from "@/components/not-found-body";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { notFoundText } from "@/i18n/page-not-found";

// params yo‘q — sarlavha asosiy tilda. [lang] sahifasidagi notFound()’da sarlavhani o‘sha sahifaning generateMetadata’si beradi
export const metadata: Metadata = { title: notFoundText.uz.title };

/**
 * 404: yo‘q manzil, chop etilmagan yoki olib tashlangan maqola, profil va yangilik. Ommaviy sahifalar header va footer’i
 * bilan; ma’lumot o‘qilmaydi (statik). Status 404 va noindex’ni Next o‘zi qo‘yadi. Matn sahifa tilida — NotFoundBody.
 */
export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <NotFoundBody />
      <PublicFooter />
    </>
  );
}
