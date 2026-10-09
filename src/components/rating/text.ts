// Manba: src/components/rating/*, src/app/admin/iqtiboslar/page.tsx, src/components/article/article-view.tsx (baho havolasi).
// i18n’ga ko‘chirishda ru/en shu kalitlar bilan qo‘shiladi (src/i18n/rating.ts).

const uz = {
  section: {
    title: "Iqtiboslar",
    count: (n: number) => `${n} ta baho`,
    empty: "Hali baho yo‘q",
    average: (avg: string) => `O‘rtacha baho: 5 dan ${avg}`,
    distribution: "Baholar taqsimoti",
    distributionRow: (stars: number, n: number) => `${stars} yulduz: ${n} ta`,
    all: (n: number) => `Barcha iqtiboslar (${n})`,
  },
  deck: {
    label: "Iqtiboslar",
    slide: "iqtibos",
    position: (i: number, n: number) => `${i} / ${n}`,
    prev: "Oldingi iqtibos",
    next: "Keyingi iqtibos",
    empty: "Birinchi iqtibosni siz qoldiring.",
    stars: (n: number) => `${n} yulduz`,
  },
  form: {
    title: "Sizning bahoingiz",
    stars: "Baho",
    star: (n: number) => `${n} yulduz`,
    starWords: ["Juda zaif", "Zaif", "O‘rtacha", "Yaxshi", "A’lo"],
    body: "Iqtibos",
    bodyPlaceholder: "Maqola haqida fikringiz",
    bodyMin: (n: number) => `Kamida ${n} ta belgi`,
    counter: (n: number, max: number) => `${n} / ${max}`,
    submit: "Yuborish",
    sent: "Yuborildi. Admin tasdiqlagach saytda ko‘rinadi.",
    status: {
      pending: "Bahoingiz moderatsiyada.",
      approved: "Bahoingiz saytda chop etilgan. Tahrirlasangiz, qayta moderatsiyaga tushadi.",
      rejected: "Bahoingiz rad etildi. Tahrirlab, qayta yuboring.",
    },
    signIn: "Baho berish uchun tizimga kiring.",
    expired: "Sessiya tugadi. Baho berish uchun qayta kiring.",
    signInButton: "Kirish",
    register: "Ro‘yxatdan o‘tish",
    own: "Bu sizning maqolangiz. O‘z maqolangizga baho bera olmaysiz.",
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

/** "4,8" — o‘zbekcha o‘nli vergul bilan */
export const formatAverage = (avg: number) => avg.toFixed(1).replace(".", ",");
