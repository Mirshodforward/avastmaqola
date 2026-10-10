// Manba: src/app/[lang]/oqituvchi/[slug]/page.tsx (lavozim, yo‘nalish, qiziqishlar va biografiya — o‘qituvchi yozgan
// matn, tarjima qilinmaydi; ilmiy daraja — credentialsLine orqali sahifa tilida)
import type { Lang } from "@/lib/langs";

const uz = {
  notFound: "Profil topilmadi",
  description: (credentials: string, institution: string, direction: string) =>
    `${credentials}, ${institution}. Ilmiy yo‘nalish: ${direction}.`,
  breadcrumb: "Sahifa yo‘li",
  authors: "Mualliflar",
  direction: "Ilmiy yo‘nalish:",
  interests: "Ilmiy qiziqishlar:",
  orcidUnverified: "(tasdiqlanmagan)",
  bio: "Biografiya",
  works: "Maqolalar",
  noWorks: "Hali chop etilgan maqolalar yo‘q.",
};

export const teacherPageText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    notFound: "Профиль не найден",
    description: (credentials, institution, direction) =>
      `${credentials}, ${institution}. Научное направление: ${direction}.`,
    breadcrumb: "Навигационная цепочка",
    authors: "Авторы",
    direction: "Научное направление:",
    interests: "Научные интересы:",
    orcidUnverified: "(не подтверждён)",
    bio: "Биография",
    works: "Статьи",
    noWorks: "Опубликованных статей пока нет.",
  },
  en: {
    notFound: "Profile not found",
    description: (credentials, institution, direction) => `${credentials}, ${institution}. Research field: ${direction}.`,
    breadcrumb: "Breadcrumb",
    authors: "Authors",
    direction: "Research field:",
    interests: "Research interests:",
    orcidUnverified: "(unverified)",
    bio: "Biography",
    works: "Articles",
    noWorks: "No articles have been published yet.",
  },
};
