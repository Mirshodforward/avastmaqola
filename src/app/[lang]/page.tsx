import type { Metadata } from "next";
import { HomePage, homeMetadata } from "@/components/home/home-page";
import { pageLang } from "@/i18n/server";

type Props = PageProps<"/[lang]">;

// Bosh sahifa uch tilda: "/" (proxy orqali /uz), /ru, /en. Til ro‘yxati va noto‘g‘ri tilga 404 — [lang]/layout.tsx.
// params Suspense’dan tashqarida o‘qiladi: noma’lum til haqiqiy 404 qaytarsin (maqola sahifasidagi kabi)
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return homeMetadata(await pageLang(params));
}

export default async function Home({ params }: Props) {
  return <HomePage lang={await pageLang(params)} />;
}
