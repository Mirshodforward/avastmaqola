// Manba: src/app/[lang]/yonalishlar/page.tsx (yo‘nalish nomlari — o‘qituvchi yozgan matn, tarjima qilinmaydi)
import type { Lang } from "@/lib/langs";
import { enPlural, ruPlural } from "./plural";

const uz = {
  title: "Ilmiy yo‘nalishlar",
  description: (university: string) => `${university} ilmiy yo‘nalishlari va har bir yo‘nalishdagi mualliflar.`,
  empty: "Hali ochiq profillar yo‘q.",
  authors: (n: number) => `${n} ta muallif`,
  articles: (n: number) => `${n} ta maqola`,
  loading: "Yuklanmoqda",
};

export const directionsPageText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    title: "Научные направления",
    description: (university) => `Научные направления ${university} и авторы по каждому из них.`,
    empty: "Открытых профилей пока нет.",
    authors: (n) => `${n} ${ruPlural(n, ["автор", "автора", "авторов"])}`,
    articles: (n) => `${n} ${ruPlural(n, ["статья", "статьи", "статей"])}`,
    loading: "Загрузка",
  },
  en: {
    title: "Research fields",
    description: (university) => `Research fields at ${university} and the authors working in each.`,
    empty: "No public profiles yet.",
    authors: (n) => `${n} ${enPlural(n, "author", "authors")}`,
    articles: (n) => `${n} ${enPlural(n, "article", "articles")}`,
    loading: "Loading",
  },
};
