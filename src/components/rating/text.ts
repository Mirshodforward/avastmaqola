// Manba: src/components/rating/*, src/app/admin/iqtiboslar/page.tsx, src/components/article/article-view.tsx (baho havolasi).
// Maqola sahifasi uch tilda — ratingText[lang]; admin paneli o‘zbekcha (T). Ruscha/inglizchada bo‘lim «Отзывы»/«Reviews»:
// mazmuni baho va fikr (o‘zbekchadagi «iqtibos» shu ma’noda)
import { enPlural, ruPlural } from "@/i18n/plural";
import type { Lang } from "@/lib/langs";

const uz = {
  section: {
    title: "Iqtiboslar",
    count: (n: number) => `${n} ta baho`,
    empty: "Hali baho yo‘q",
    average: (avg: string) => `O‘rtacha baho: 5 dan ${avg}`,
    more: (n: number) => `Yana ${n} ta iqtibos`,
    less: "Yashirish",
    /** Oynani ochadigan tugma (maqola tepasida ham, «Iqtiboslar» bo‘limida ham) */
    write: "Iqtibos keltirish",
    /** Taqsimot ro‘yxati: ko‘rinishi yashirin, ekran o‘quvchi har qatorni matn bilan o‘qiydi */
    distribution: "Baholar taqsimoti",
    distributionRow: (stars: number, n: number) => `${stars} yulduz: ${n} ta`,
  },
  form: {
    /** Oyna sarlavhasi — uni ochgan tugma bilan bir xil */
    title: "Iqtibos keltirish",
    close: "Yopish",
    stars: "Baho",
    star: (n: number) => `${n} yulduz`,
    /** Faqat ekran o‘quvchi uchun (aria-label) */
    starWords: ["Juda zaif", "Zaif", "O‘rtacha", "Yaxshi", "A’lo"],
    body: "Iqtibos",
    bodyPlaceholder: "Maqola haqida fikringiz",
    /** Server xabari bilan bir xil (ratingInputSchema) */
    bodyMin: (n: number) => `Kamida ${n} ta belgi yozing`,
    counter: (n: number, max: number) => `${n} / ${max}`,
    submit: "Yuborish",
    sent: "Yuborildi. Admin tasdiqlagach saytda ko‘rinadi.",
    status: {
      pending: "Bahoingiz moderatsiyada.",
      approved: "Bahoingiz saytda chop etilgan. Tahrirlasangiz, qayta moderatsiyaga tushadi.",
      rejected: "Bahoingiz rad etildi. Tahrirlab, qayta yuboring.",
    },
    signIn: "Iqtibos keltirish uchun avval tizimga kiring.",
    expired: "Sessiya tugadi. Iqtibos keltirish uchun qayta kiring.",
    signInButton: "Kirish",
    own: "Bu sizning maqolangiz: o‘z maqolangizga baho berib, iqtibos keltira olmaysiz.",
    loading: "Yuklanmoqda",
    starsRequired: "Yulduzlardan birini tanlang",
  },
  badge: {
    rate: "Baho berish",
    label: (avg: string, n: number) => `O‘rtacha baho ${avg}, ${n} ta baho`,
  },
  admin: {
    title: "Iqtiboslar",
    queue: "Moderatsiya navbati",
    empty: "Navbat bo‘sh.",
    recent: "So‘nggi qarorlar",
    approve: "Chop etish",
    reject: "Rad etish",
    remove: "Olib tashlash",
    status: { pending: "Moderatsiyada", approved: "Chop etilgan", rejected: "Rad etilgan" },
    meta: (name: string, date: string) => `${name}, ${date}`,
    conflict: "Iqtibos shu orada o‘zgargan. Sahifani yangilab, yangi matnni ko‘ring.",
  },
};

export type RatingText = typeof uz;
export const T: RatingText = uz;

const RU_RATINGS: [string, string, string] = ["оценка", "оценки", "оценок"];
const RU_REVIEWS: [string, string, string] = ["отзыв", "отзыва", "отзывов"];

export const ratingText: Record<Lang, RatingText> = {
  uz,
  ru: {
    section: {
      title: "Отзывы",
      count: (n) => `${n} ${ruPlural(n, RU_RATINGS)}`,
      empty: "Оценок пока нет",
      average: (avg) => `Средняя оценка: ${avg} из 5`,
      more: (n) => `Ещё ${n} ${ruPlural(n, RU_REVIEWS)}`,
      less: "Скрыть",
      write: "Оставить отзыв",
      distribution: "Распределение оценок",
      distributionRow: (stars, n) => `${stars} ${ruPlural(stars, ["звезда", "звезды", "звёзд"])}: ${n}`,
    },
    form: {
      title: "Оставить отзыв",
      close: "Закрыть",
      stars: "Оценка",
      star: (n) => `${n} ${ruPlural(n, ["звезда", "звезды", "звёзд"])}`,
      starWords: ["Очень слабо", "Слабо", "Средне", "Хорошо", "Отлично"],
      body: "Отзыв",
      bodyPlaceholder: "Ваше мнение о статье",
      bodyMin: (n) => `Напишите не менее ${n} ${ruPlural(n, ["символа", "символов", "символов"])}`,
      counter: (n, max) => `${n} / ${max}`,
      submit: "Отправить",
      sent: "Отправлено. Отзыв появится на сайте после одобрения администратором.",
      status: {
        pending: "Ваш отзыв на модерации.",
        approved: "Ваш отзыв опубликован на сайте. Если вы его измените, он снова пройдёт модерацию.",
        rejected: "Ваш отзыв отклонён. Отредактируйте его и отправьте снова.",
      },
      signIn: "Чтобы оставить отзыв, сначала войдите в систему.",
      expired: "Сессия истекла. Войдите снова, чтобы оставить отзыв.",
      signInButton: "Войти",
      own: "Это ваша статья: оценивать собственную статью и оставлять к ней отзыв нельзя.",
      loading: "Загрузка",
      starsRequired: "Выберите оценку",
    },
    badge: {
      rate: "Оценить",
      label: (avg, n) => `Средняя оценка ${avg}, ${n} ${ruPlural(n, RU_RATINGS)}`,
    },
    admin: {
      title: "Отзывы",
      queue: "Очередь модерации",
      empty: "Очередь пуста.",
      recent: "Последние решения",
      approve: "Опубликовать",
      reject: "Отклонить",
      remove: "Удалить",
      status: { pending: "На модерации", approved: "Опубликован", rejected: "Отклонён" },
      meta: (name, date) => `${name}, ${date}`,
      conflict: "Отзыв за это время изменился. Обновите страницу, чтобы увидеть новый текст.",
    },
  },
  en: {
    section: {
      title: "Reviews",
      count: (n) => `${n} ${enPlural(n, "rating", "ratings")}`,
      empty: "No ratings yet",
      average: (avg) => `Average rating: ${avg} out of 5`,
      more: (n) => `${n} more ${enPlural(n, "review", "reviews")}`,
      less: "Show less",
      write: "Write a review",
      distribution: "Rating breakdown",
      distributionRow: (stars, n) => `${stars} ${enPlural(stars, "star", "stars")}: ${n}`,
    },
    form: {
      title: "Write a review",
      close: "Close",
      stars: "Rating",
      star: (n) => `${n} ${enPlural(n, "star", "stars")}`,
      starWords: ["Very poor", "Poor", "Average", "Good", "Excellent"],
      body: "Review",
      bodyPlaceholder: "Your thoughts on the article",
      bodyMin: (n) => `Write at least ${n} characters`,
      counter: (n, max) => `${n} / ${max}`,
      submit: "Submit",
      sent: "Sent. Your review will appear on the site after an administrator approves it.",
      status: {
        pending: "Your review is awaiting moderation.",
        approved: "Your review is published. If you edit it, it goes back to moderation.",
        rejected: "Your review was rejected. Edit it and submit it again.",
      },
      signIn: "Sign in first to write a review.",
      expired: "Your session has expired. Sign in again to write a review.",
      signInButton: "Sign in",
      own: "This is your article: you can't rate or review your own article.",
      loading: "Loading",
      starsRequired: "Choose a rating",
    },
    badge: {
      rate: "Rate",
      label: (avg, n) => `Average rating ${avg}, ${n} ${enPlural(n, "rating", "ratings")}`,
    },
    admin: {
      title: "Reviews",
      queue: "Moderation queue",
      empty: "The queue is empty.",
      recent: "Recent decisions",
      approve: "Publish",
      reject: "Reject",
      remove: "Remove",
      status: { pending: "Pending", approved: "Published", rejected: "Rejected" },
      meta: (name, date) => `${name}, ${date}`,
      conflict: "The review changed in the meantime. Refresh the page to see the new text.",
    },
  },
};

/** "4,8" — o‘zbekcha va ruscha o‘nli vergul bilan, inglizcha nuqta bilan */
export const formatAverage = (avg: number, lang: Lang = "uz") => {
  const text = avg.toFixed(1);
  return lang === "en" ? text : text.replace(".", ",");
};
