import type { Metadata } from "next";
import { commonText } from "@/i18n/common";
import { isLang } from "@/i18n/lang";
import { pageLang } from "@/i18n/server";
import { SITE_NAME } from "@/lib/brand";
import { LANGS } from "@/lib/langs";

type Props = LayoutProps<"/[lang]">;

/**
 * Ommaviy sahifalar uch tilda: o‘zbekchasi prefikssiz (proxy "/..." ni "/uz/..." ga rewrite qiladi), ruscha /ru,
 * inglizcha /en. Kabinet, admin va kirish sahifalari bu segmentdan tashqarida — hozircha faqat o‘zbekcha.
 * <html lang> root layout’da o‘zbekcha, shuning uchun sahifa tili shu o‘ramda (ekran o‘quvchi talaffuzi).
 */
export async function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

/** O‘zbekchasi — root layout’dagi sarlavha va tavsif; ruscha va inglizchasi shu yerda */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang) || lang === "uz") return {};
  const t = commonText[lang].rootLayout;
  return {
    title: { default: t.defaultTitle(SITE_NAME), template: t.titleTemplate(SITE_NAME) },
    description: t.description,
    openGraph: { type: "website", siteName: SITE_NAME, locale: lang === "ru" ? "ru_RU" : "en_US", description: t.description },
  };
}

export default async function LangLayout({ children, params }: Props) {
  const lang = await pageLang(params);
  return (
    <div lang={lang} className="contents">
      {children}
    </div>
  );
}
