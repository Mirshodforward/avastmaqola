// Manba: src/app/layout.tsx, src/components/public-header.tsx, src/components/site-brand.tsx, src/components/dashboard/shell.tsx
import type { Lang } from "@/lib/langs";

const uz = {
  rootLayout: {
    // layout.tsx
    defaultTitle: (site: string) => `${site} — ilmiy maqolalar portali`,
    titleTemplate: (site: string) => `%s — ${site}`,
    description:
      "Asman Universiteti o‘qituvchilarining ilmiy maqolalari va profillari: uch tilda annotatsiyalar, ochiq PDF, Google Scholar uchun moslangan sahifalar.",
  },
  publicHeader: {
    // public-nav.tsx
    navLabel: "Asosiy",
    articles: "Maqolalar",
    authors: "Mualliflar",
    directions: "Yo‘nalishlar",
    news: "Yangiliklar",
    about: "Portal haqida",
    login: "Kirish",
    register: "Ro‘yxatdan o‘tish",
    menu: "Menyu",
  },
  siteBrand: {
    // site-brand.tsx
    tagline: "Ilmiy maqolalar portali",
  },
  publicFooter: {
    // public-footer.tsx (bo‘lim nomlari publicHeader’dan)
    navLabel: "Bo‘limlar",
    copyright: (university: string, service: string) => `© ${university}. ${service} xizmati asosida ishlaydi.`,
  },
  dashboardShell: {
    // dashboard/shell.tsx
    navLabel: "Kabinet",
    dashboard: "Kabinet",
    profile: "Profil",
    admin: "Admin panel",
    home: "Bosh sahifa",
    loading: "Yuklanmoqda",
  },
  switcher: {
    // til almashtirgich (keyin quriladi)
    label: "Tilni tanlash",
  },
};

export const commonText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    rootLayout: {
      defaultTitle: (site) => `${site} — портал научных статей`,
      titleTemplate: (site) => `%s — ${site}`,
      description:
        "Научные статьи и профили преподавателей Asman Universiteti: аннотации на трёх языках, PDF в открытом доступе, страницы, адаптированные для Google Scholar.",
    },
    publicHeader: {
      navLabel: "Основная",
      articles: "Статьи",
      authors: "Авторы",
      directions: "Направления",
      news: "Новости",
      about: "О портале",
      login: "Войти",
      register: "Регистрация",
      menu: "Меню",
    },
    siteBrand: { tagline: "Портал научных статей" },
    publicFooter: {
      navLabel: "Разделы",
      copyright: (university, service) => `© ${university}. Работает на платформе ${service}.`,
    },
    dashboardShell: {
      navLabel: "Кабинет",
      dashboard: "Кабинет",
      profile: "Профиль",
      admin: "Админ-панель",
      home: "Главная",
      loading: "Загрузка",
    },
    switcher: { label: "Выбор языка" },
  },
  en: {
    rootLayout: {
      defaultTitle: (site) => `${site} — research articles portal`,
      titleTemplate: (site) => `%s — ${site}`,
      description:
        "Research articles and profiles of Asman Universiteti teachers: abstracts in three languages, open-access PDFs, pages optimized for Google Scholar.",
    },
    publicHeader: {
      navLabel: "Main",
      articles: "Articles",
      authors: "Authors",
      directions: "Research fields",
      news: "News",
      about: "About",
      login: "Sign in",
      register: "Sign up",
      menu: "Menu",
    },
    siteBrand: { tagline: "Research articles portal" },
    publicFooter: {
      navLabel: "Sections",
      copyright: (university, service) => `© ${university}. Powered by ${service}.`,
    },
    dashboardShell: {
      navLabel: "Dashboard",
      dashboard: "Dashboard",
      profile: "Profile",
      admin: "Admin panel",
      home: "Home",
      loading: "Loading",
    },
    switcher: { label: "Choose language" },
  },
};
