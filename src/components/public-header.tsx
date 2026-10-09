import { PublicNav } from "@/components/public-nav";
import { SiteBrand } from "@/components/site-brand";

/**
 * Ommaviy sahifalar (maqola, ro‘yxat, o‘qituvchi profili) sarlavhasi — bosh sahifadagi bilan bir xil belgi va menyu.
 * Universitet nomi maqola sarlavhasidan (h1) ancha kichik: Scholar sarlavha va mualliflarni meta teglardan oladi.
 */
export function PublicHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <SiteBrand />
        <PublicNav />
      </div>
    </header>
  );
}
