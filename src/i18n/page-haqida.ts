// Manba: src/app/[lang]/haqida/page.tsx. steps — maqola joylash bosqichlari (bosh sahifadagi jarayon ham shu yerdan;
// o‘zbekchasi src/lib/portal.ts dagi PORTAL_STEPS bilan bir xil)
import type { Lang } from "@/lib/langs";

const uz = {
  title: "Portal haqida",
  description: (university: string) => `${university} ilmiy maqolalar portali: maqola qanday joylanadi, o‘qish va iqtibos.`,
  intro: (university: string) =>
    `${university} o‘qituvchilarining ilmiy maqolalari universitet ko‘rib chiqqanidan keyin shu portalda e’lon qilinadi.`,
  stepsTitle: "Maqola qanday joylanadi",
  steps: [
    { title: "Profilni to‘ldiring", text: "Rasm, lavozim, ilmiy yo‘nalish va muassasa maqola sahifasining tepasida ko‘rinadi." },
    {
      title: "Maqolani qo‘shing",
      text: "PDF hamda o‘zbek, rus va ingliz tilida sarlavha, annotatsiya va kalit so‘zlar. AI yordamchi ularni PDF asosida to‘ldirib beradi.",
    },
    { title: "Ko‘rib chiqishga yuboring", text: "Universitet xodimi tekshiradi, natija Telegram’ga keladi." },
    { title: "Maqola chop etiladi", text: "Alohida ommaviy sahifa, Google Scholar uchun moslangan." },
  ],
  openTitle: "O‘qish va iqtibos",
  openText:
    "Maqola sahifasi va PDF fayli hammaga ochiq. Har bir maqolaning litsenziyasi va tayyor iqtibosi (APA, BibTeX) uning sahifasida.",
  authorsTitle: "Mualliflarga",
  noPassword: "Parol kerak emas: tasdiqlash kodi Telegram orqali keladi.",
  register: "Ro‘yxatdan o‘tish",
  login: "Kirish",
};

export const aboutPageText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    title: "О портале",
    description: (university) => `Портал научных статей ${university}: размещение статей, чтение и цитирование.`,
    intro: (university) =>
      `Научные статьи преподавателей ${university} публикуются на этом портале после того, как их рассмотрит университет.`,
    stepsTitle: "Как разместить статью",
    steps: [
      { title: "Заполните профиль", text: "Фото, должность, научное направление и учреждение отображаются вверху страницы статьи." },
      {
        title: "Добавьте статью",
        text: "PDF, а также название, аннотация и ключевые слова на узбекском, русском и английском языках. ИИ-помощник заполнит их на основе PDF.",
      },
      { title: "Отправьте на рассмотрение", text: "Сотрудник университета проверит статью, а результат придёт в Telegram." },
      { title: "Статья опубликована", text: "Отдельная открытая страница, адаптированная для Google Scholar." },
    ],
    openTitle: "Чтение и цитирование",
    openText:
      "Страница статьи и PDF-файл открыты для всех. Лицензия и готовая ссылка для цитирования (APA, BibTeX) указаны на странице каждой статьи.",
    authorsTitle: "Авторам",
    noPassword: "Пароль не нужен: код подтверждения придёт в Telegram.",
    register: "Регистрация",
    login: "Войти",
  },
  en: {
    title: "About the portal",
    description: (university) => `The ${university} research articles portal: how articles are posted, read and cited.`,
    intro: (university) =>
      `Research articles by ${university} faculty are published on this portal once the university has reviewed them.`,
    stepsTitle: "How to post an article",
    steps: [
      { title: "Complete your profile", text: "Your photo, position, research field and institution appear at the top of the article page." },
      {
        title: "Add your article",
        text: "The PDF, plus the title, abstract and keywords in Uzbek, Russian and English. The AI assistant fills these in from the PDF.",
      },
      { title: "Submit for review", text: "A university staff member reviews it, and you receive the result in Telegram." },
      { title: "Your article is published", text: "Its own public page, optimized for Google Scholar." },
    ],
    openTitle: "Reading and citing",
    openText: "Every article page and PDF is open to everyone. Each article’s page shows its license and a ready-made citation (APA, BibTeX).",
    authorsTitle: "For authors",
    noPassword: "No password needed: the verification code is sent via Telegram.",
    register: "Sign up",
    login: "Sign in",
  },
};
