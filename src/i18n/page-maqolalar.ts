// Manba: src/app/[lang]/maqolalar/page.tsx, src/components/article/article-list.tsx (o‘qituvchi profilida ham)
import type { Lang } from "@/lib/langs";

const uz = {
  page: {
    // [lang]/maqolalar/page.tsx
    title: "Maqolalar",
    description: (university: string) =>
      `${university} o‘qituvchilarining universitet tasdiqlagan ilmiy maqolalari: yillar bo‘yicha to‘liq ro‘yxat.`,
    empty: "Hali chop etilgan maqolalar yo‘q.",
    loading: "Yuklanmoqda",
  },
  list: {
    // article/article-list.tsx — kartaning chap panelidagi sondagi joyi
    issue: (n: number) => `${n}-son`,
    seq: (n: number) => `${n}-maqola`,
  },
};

export const articlesPageText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    page: {
      title: "Статьи",
      description: (university) =>
        `Одобренные университетом научные статьи преподавателей ${university}: полный список по годам.`,
      empty: "Опубликованных статей пока нет.",
      loading: "Загрузка",
    },
    list: {
      issue: (n) => `Выпуск ${n}`,
      seq: (n) => `Статья ${n}`,
    },
  },
  en: {
    page: {
      title: "Articles",
      description: (university) => `University-approved research articles by ${university} faculty, listed in full by year.`,
      empty: "No articles have been published yet.",
      loading: "Loading",
    },
    list: {
      issue: (n) => `Issue ${n}`,
      seq: (n) => `Article ${n}`,
    },
  },
};
