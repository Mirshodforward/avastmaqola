// Manba: src/app/[lang]/mualliflar/page.tsx (ism, lavozim va yo‘nalish — o‘qituvchi yozgan matn, tarjima qilinmaydi;
// ilmiy daraja — credentialsLine orqali sahifa tilida)
import type { Lang } from "@/lib/langs";
import { enPlural, ruPlural } from "./plural";

const uz = {
  title: "Mualliflar",
  description: (university: string) => `${university} mualliflari: lavozimi, ilmiy yo‘nalishi va portaldagi maqolalari.`,
  empty: "Hali ochiq profillar yo‘q.",
  articles: (n: number) => `${n} ta maqola`,
  loading: "Yuklanmoqda",
};

export const authorsPageText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    title: "Авторы",
    description: (university) => `Авторы ${university}: должности, научные направления и статьи на портале.`,
    empty: "Открытых профилей пока нет.",
    articles: (n) => `${n} ${ruPlural(n, ["статья", "статьи", "статей"])}`,
    loading: "Загрузка",
  },
  en: {
    title: "Authors",
    description: (university) => `Authors at ${university}: their positions, research fields and articles on the portal.`,
    empty: "No public profiles yet.",
    articles: (n) => `${n} ${enPlural(n, "article", "articles")}`,
    loading: "Loading",
  },
};
