# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **O‘qituvchi-muallif** — Asman Universiteti o‘qituvchilari. Ilmiy maqolasini portalga joylaydi: profilni to‘ldiradi, PDF yuklaydi, sarlavha, annotatsiya va kalit so‘zlarni uch tilda kiritadi (AI yordamchi ularni PDF’dan to‘ldirib beradi), ko‘rib chiqishga yuboradi, natijani Telegram’da oladi, chop etilgach Zenodo orqali DOI oladi. Texnik bo‘lmagan, turli yoshdagi foydalanuvchilar. Maqola asosan kompyuterda joylanadi va tahrirlanadi; telefon ko‘rish va bildirishnomalar uchun, lekin hamma narsa telefonda ham to‘liq ishlashi kerak.
- **O‘quvchi va tadqiqotchi** — talabalar, boshqa olimlar, ilmiy jamoatchilik, shuningdek Google Scholar va boshqa indeks botlari. Maqolani topadi, o‘qiydi, PDF’ni yuklab oladi, iqtibos (APA, BibTeX) oladi, muallif profilini ko‘radi.
- Ikkala guruh **teng ustuvor** (egasi 2026-10-10 da tasdiqlagan).
- **Universitet xodimlari** — admin (statistika, ko‘rib chiqish navbati, maqolani chop etish yoki izoh bilan qaytarish, yangiliklar, reytinglarni moderatsiya qilish) va moderator (jurnal soni va maqola raqami).

## Product Purpose

Asman Universiteti o‘qituvchilarining ilmiy maqolalarini bitta rasmiy portalda e’lon qilish. Universitet tasdiqlagan har bir maqola o‘zbek, rus va ingliz tilidagi sarlavha, annotatsiya, kalit so‘zlar va PDF bilan alohida ochiq sahifaga ega bo‘ladi, Google Scholar uchun moslangan va iqtibos keltirishga tayyor; muallif profili uning barcha maqolalarini to‘playdi.

Muvaffaqiyat: maqolalar topiladi, o‘qiladi va iqtibos qilinadi (Google Scholar, OpenAlex, ORCID orqali), o‘qituvchi esa maqolani oson, tez va xatosiz joylaydi.

## Positioning

Universitetning o‘z rasmiy ilmiy portali, umumiy repozitoriy emas: har bir maqolani universitet xodimi ko‘rib chiqadi, u uch tilda to‘liq metadata bilan chiqadi va muallifning universitetdagi profiliga bog‘lanadi. O‘qituvchi uchun: parolsiz Telegram orqali kirish, PDF’dan uch tilni to‘ldiradigan AI yordamchi va o‘z Zenodo akkaunti orqali bepul DOI.

## Operating Context

- Kirish faqat Telegram orqali: 6 xonali kod, parol yo‘q.
- Maqola oqimi: qoralama → yuborilgan → admin ko‘rib chiqadi → chop etilgan yoki izoh bilan tuzatishga qaytarilgan; natija o‘qituvchiga Telegram’da keladi.
- Chop etilgandan keyin o‘qituvchi maqolani o‘z Zenodo akkaunti orqali joylaydi (har joylashda Zenodo’da ruxsat beradi) va DOI oladi.
- Ommaviy bo‘limlar: bosh sahifa, Maqolalar, maqola sahifasi (`/maqola/{id}`), Mualliflar, muallif profili (`/oqituvchi/{slug}`), Yo‘nalishlar, Yangiliklar, Portal haqida.
- Kabinet: profil tahriri, maqola muharriri (PDF birinchi qadam, yonida AI yordamchi), maqola holati, Zenodo paneli.
- Xodimlar: `/admin` va `/moderator` panellari.

## Capabilities and Constraints

- Til: interfeys o‘zbekcha (lotin yozuvi, ‘ va ’ apostroflari). Maqola metadatasi uz/ru/en uchala tilda majburiy. To‘liq uch tilli interfeys rejalashtirilgan (`src/i18n` lug‘atlari tayyor, hali ulanmagan).
- Atamalar: ommaviy katalog — «Mualliflar» (`/mualliflar`), admin’da — «O‘qituvchilar»; profil manzili `/oqituvchi/{slug}`.
- Google Scholar talablari: har bir maqola alohida URL’da, annotatsiya login’siz ko‘rinadi, `citation_*` teglari, PDF havolasi; ommaviy sahifalar statik va crawl qilinadigan bo‘lishi shart.
- Maqola sahifasi professional maqola tartibida: sarlavha → mualliflar va tashkilotlar → annotatsiya va kalit so‘zlar → PDF → nashr ma’lumotlari.
- Muharrirda PDF birinchi qadam (egasining qarori).
- Litsenziyalar: CC BY 4.0 (sukut), CC BY-NC 4.0, barcha huquqlar himoyalangan.
- Texnik: Next.js 16 (App Router), Tailwind CSS v4, PostgreSQL; yorug‘ va qorong‘i rejim mavjud.
- Ochiq: universitetning rasmiy veb-sayt manzili hali berilmagan.

## Brand Commitments

- Nom: «Asman Universiteti» — sayt nomi; sahifa sarlavhalari «%s — Asman Universiteti». «Avtomaqola» — faqat xizmat (dastur) nomi, sahifada kichik yozuv.
- Rasmiy logo: Asman University logotipi (vektor), `src/components/university-logo.tsx`. O‘zgartirilmaydi.
- Ovoz: qisqa, aniq, rasmiy va samimiy o‘zbekcha. Yordamchi tushuntirish matnlari minimal — egasining doimiy talabi «sodda, tushunarli».
- Telegram bilan bog‘liq tugmalar bot matnlari bilan bir xil: «Telegram’da ochish», «Kodni qayta yuborish».

## Evidence on Hand

- Haqiqiy maqolalar, mualliflar va yangiliklar bazada; ommaga faqat admin tasdiqlaganlari chiqadi.
- Rasmiy logo fayllari (vektor PDF) va `university-logo.tsx` komponenti.
- Yo‘q va hech qachon to‘qilmaydi: mijoz fikrlari, soxta raqamlar, matbuot. Soxta maqola matni, soxta muallif yoki namuna-maqola ko‘rsatilmaydi — Google Scholar soxta ilmiy matnni indekslab qo‘yishi mumkin. Universitetning yuridik muhriga o‘xshash «tasdiqlangan» belgisi ishlatilmaydi.

## Product Principles

1. **Ilmiy ishonch birinchi.** Har bir sahifa universitetning rasmiy portali kabi ishonch uyg‘otadi; hech qanday to‘qilgan ma’lumot yo‘q.
2. **Ikki auditoriya, ikki vazifa.** O‘quvchi topadi va o‘qiydi; o‘qituvchi tez va xatosiz joylaydi. Biri ikkinchisi hisobiga qurbon qilinmaydi.
3. **Soddalik.** Eng qisqa yozuv; keraksiz maydon, bosqich va tushuntirish yo‘q.
4. **Indekslanish.** Ommaviy sahifalar login’siz, statik va Scholar talablariga mos.
5. **Uch til teng.** O‘zbek, rus va ingliz metadata bir xil to‘liqlikda.

## Accessibility & Inclusion

- WCAG 2.1 AA: matn va boshqaruv elementlari kontrasti, klaviatura bilan to‘liq boshqaruv, ekran o‘quvchilari uchun to‘g‘ri belgilar.
- Yorug‘ va qorong‘i rejim.
- Texnik bo‘lmagan va turli yoshdagi o‘qituvchilar uchun aniq, yetarlicha katta boshqaruv elementlari.
