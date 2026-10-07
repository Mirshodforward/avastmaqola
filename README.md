# Avtomaqola — maqola yozing, biz joylab beramiz

Universitet o‘qituvchilari uchun xizmat: maqolani bir marta yuklash va uni ilmiy platformalarga joylash, hamda ORCID iD bo‘yicha barcha maqolalarni bir joyga yig‘ish. G‘oya, platformalar imkoniyati va rejalar: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

**Stek:** Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, PostgreSQL + Drizzle ORM, Telegram Bot API.

## Ishga tushirish

Talab: Node.js 22.13+ (yoki 24 LTS). PostgreSQL yoki Docker o‘rnatish shart emas — lokal baza npm paketi ichida keladi.

```bash
npm install
cp .env.example .env.local        # AUTH_SECRET va TELEGRAM_* ni to‘ldiring

npm run db:start                  # 1-terminal: lokal PostgreSQL (localhost:5432)
npm run db:migrate                # bir marta: jadvallarni yaratadi
npm run dev                       # 2-terminal: http://localhost:3000
npm run bot:poll                  # 3-terminal: Telegram bot (lokal rejim)
```

### Telegram bot

1. Telegram’da [@BotFather](https://t.me/BotFather) → `/newbot` → token va username oling.
2. `.env.local` ga yozing: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (`@` belgisisiz), `TELEGRAM_WEBHOOK_SECRET` (tasodifiy satr).
3. **Lokal:** `npm run bot:poll` — Telegram’dan xabarlarni olib, `localhost` dagi webhook’ga uzatadi (ngrok kerak emas).
4. **Production:** `APP_URL=https://...` qiling va bir marta `npm run bot:webhook` ni ishga tushiring.

Token bo‘sh bo‘lsa, dev rejimida bot "yuboradigan" xabarlar (kodlar ham) `npm run dev` konsoliga chiqadi.

### Kirish qanday ishlaydi

1. Foydalanuvchi saytda ma’lumotlarini kiritadi (kirishda — faqat telefon raqamini).
2. Sayt botga havola beradi: `t.me/<bot>?start=<token>`.
3. Bot kontaktni so‘raydi. Foydalanuvchi **o‘z** raqamini yuboradi, bot uni saytda kiritilgan raqam bilan solishtiradi.
4. Bot 6 xonali kod yuboradi (2 daqiqa amal qiladi), foydalanuvchi uni saytda kiritadi va kabinetga kiradi.

## Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run lint` | ESLint |
| `npm run db:start` | Lokal PostgreSQL (ma’lumotlar `.pgdata/` da) |
| `npm run db:generate` | `schema.ts` o‘zgarganda yangi migratsiya yaratish |
| `npm run db:migrate` | Migratsiyalarni bazaga qo‘llash |
| `npm run db:studio` | Bazani brauzerda ko‘rish (Drizzle Studio) |
| `npm run bot:poll` | Botni lokal rejimda ishga tushirish |
| `npm run bot:webhook` | Production webhook’ni o‘rnatish |

## Tuzilma

```
src/app/                 sahifalar va API (/api/auth/*, /api/telegram/webhook)
src/components/          UI komponentlar
src/lib/                 klient va server uchun umumiy kod (validatsiya, tiplar)
src/server/auth/         kirish oqimi, sessiyalar, kodlar, limitlar
src/server/telegram/     bot: update’lar, xabarlar
src/server/orcid/        ORCID Public API
src/server/db/           Drizzle sxemasi va ulanish
drizzle/                 SQL migratsiyalar
scripts/                 lokal baza va bot skriptlari
docs/ARCHITECTURE.md     arxitektura va reja
```
