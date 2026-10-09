import { PublicNav } from "@/components/public-nav";
import { PUBLIC_WIDTH } from "@/components/public-width";
import { SiteBrand } from "@/components/site-brand";

/**
 * Ommaviy sahifalar (maqola, ro‘yxat, o‘qituvchi profili) sarlavhasi — bosh sahifadagi bilan bir xil belgi, menyu va en.
 * Universitet nomi maqola sarlavhasidan (h1) ancha kichik: Scholar sarlavha va mualliflarni meta teglardan oladi.
 */
export function PublicHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className={`flex items-center justify-between gap-4 py-3 ${PUBLIC_WIDTH}`}>
        <SiteBrand />
        <PublicNav />
      </div>
    </header>
  );
}
