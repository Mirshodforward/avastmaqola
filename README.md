# Asman Universiteti ilmiy maqolalari (Avtomaqola)

Universitet o‘qituvchilarining ilmiy maqolalari portali. O‘qituvchi Telegram orqali kiradi, profilini to‘ldiradi va maqolani (PDF + o‘zbek, rus, ingliz tilidagi sarlavha, annotatsiya, kalit so‘zlar) yuboradi; AI yordamchi maydonlarni PDF’dan to‘ldiradi. Universitet xodimi (admin/moderator) tasdiqlagach, maqola alohida ommaviy sahifada chiqadi — Google Scholar uchun moslangan; o‘qituvchi uni o‘z Zenodo akkaunti orqali joylab, bepul DOI oladi.

**Stek:** Next.js 16.4 (App Router, Cache Components), React 19, Tailwind CSS 4, PostgreSQL + Drizzle ORM, Telegram Bot API, Claude API (AI yordamchi), Zenodo API.

**Hujjatlar:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — arxitektura, oqimlar, xavfsizlik · [PRODUCT.md](PRODUCT.md) — mahsulot · [DESIGN.md](DESIGN.md) — dizayn tizimi.

---

## Production’ga chiqarish (deploy)

### 1. Talablar

| Nima | Talab |
|---|---|
| Server | Linux, **bitta** Node.js jarayoni (pastda «Muhim cheklovlar») |
| Node.js | 22.13+ yoki 24 LTS |
| PostgreSQL | 14+ (tavsiya: 16 yoki 17), UTF8 kodlashdagi baza |
| Domen va HTTPS | Majburiy: Telegram webhook, Zenodo OAuth va xavfsiz cookie’lar (`__Host-`, `Secure`) faqat https bilan ishlaydi |
| Reverse proxy | nginx (namuna pastda) |
| Disk | Doimiy papka (`STORAGE_DIR`): profil rasmlari, maqola PDF’lari, yangilik rasmlari |

> `npm run db:start` (embedded PostgreSQL) **faqat lokal ishlab chiqish uchun**. Production’da haqiqiy PostgreSQL server ishlating.

### 2. Muhit o‘zgaruvchilari

Production’da `.env.local` emas, server muhitiga (masalan, systemd `EnvironmentFile`) yoziladi. Namuna: [.env.example](.env.example).

| O‘zgaruvchi | Majburiymi | Izoh |
|---|---|---|
| `DATABASE_URL` | ha | `postgres://user:parol@host:5432/avtomaqola` |
| `AUTH_SECRET` | ha | Kamida 32 belgili tasodifiy satr: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. O‘zgartirilsa, hamma foydalanuvchi qayta kirishi kerak bo‘ladi |
| `APP_URL` | ha | Saytning tashqi manzili, oxirida `/` siz: `https://maqola.example.uz`. **Build paytida ham kerak** (bo‘lmasa build to‘xtaydi): `robots.txt`, canonical va Scholar havolalari shundan yoziladi. Domen o‘zgarsa — qayta build qiling |
| `STORAGE_DIR` | ha | Absolyut, deploy’da o‘chmaydigan papka: `/var/lib/avtomaqola/storage`. Ichida `avatars/`, `articles/`, `news/` |
| `TELEGRAM_BOT_USERNAME` | ha | Bot username, `@` siz |
| `TELEGRAM_BOT_TOKEN` | ha | [@BotFather](https://t.me/BotFather) bergan token |
| `TELEGRAM_WEBHOOK_SECRET` | ha | 1–256 belgili tasodifiy satr (`A-Z a-z 0-9 _ -`) |
| `ANTHROPIC_API_KEY` | yo‘q | Claude: muharrirdagi AI yordamchi va «Internetdagi ma’lumotlarim» qidiruvi. Kalit bo‘lmasa ikkalasi o‘chiq. Lokal `.env.local`dagi `CLAUDE-API-KEY` nomi production’da ishlamaydi (systemd/shell defisli nomni qabul qilmaydi) |
| `ZENODO_URL` | yo‘q | `https://sandbox.zenodo.org` (sinov) yoki `https://zenodo.org` — boshqasi qabul qilinmaydi |
| `ZENODO_CLIENT_ID`, `ZENODO_CLIENT_SECRET` | yo‘q | Zenodo OAuth ilova (6-bo‘lim). Uchala `ZENODO_*` bo‘lmasa, Zenodo paneli ko‘rinmaydi |

`NODE_ENV=production` bo‘lishi shart (`npm start` o‘zi qo‘yadi).

### 3. O‘rnatish va ishga tushirish

Hammasini (clone, build, ishga tushirish) bitta foydalanuvchi nomidan bajaring (namunada `avtomaqola`): ishlab turgan server `.next` papkasiga ham yozadi.

```bash
git clone git@github.com:Mirshodforward/avastmaqola.git /opt/avtomaqola
cd /opt/avtomaqola
npm ci --include=dev        # devDependencies ham kerak: build (TypeScript, Tailwind) va migratsiya (drizzle-kit)

set -a; . /etc/avtomaqola.env; set +a   # muhit o‘zgaruvchilari (build ham APP_URL’ni o‘qiydi)
npm run db:migrate          # jadvallar va barcha migratsiyalar (drizzle/)
npm run build
npm start -- -H 127.0.0.1   # sinov: http://127.0.0.1:3000; doimiy ishlashi — systemd (pastda)
```

**systemd** (`/etc/systemd/system/avtomaqola.service`):

```ini
[Unit]
Description=Asman Universiteti ilmiy maqolalari (Next.js)
After=network.target postgresql.service

[Service]
User=avtomaqola
WorkingDirectory=/opt/avtomaqola
EnvironmentFile=/etc/avtomaqola.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start -- -H 127.0.0.1
Restart=always

[Install]
WantedBy=multi-user.target
```

`-H 127.0.0.1` shart: busiz Next barcha tarmoq interfeyslarida (0.0.0.0) tinglaydi va 3000-port orqali nginx chetlab o‘tiladi. `STORAGE_DIR` papkasi shu `User` uchun yoziladigan bo‘lsin.

**nginx** (asosiysi):

```nginx
server {
    listen 443 ssl http2;
    server_name maqola.example.uz;
    # ssl_certificate ... (masalan, certbot)

    client_max_body_size 11m;                      # PDF va rasmlar 10 MB gacha

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;   # IP bo‘yicha limitlar shunga tayanadi
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/articles/ {                      # AI yordamchi javobi oqim bo‘lib keladi
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }

    location /api/zenodo/ {                        # Zenodo’ga joylash sinxron, eng uzog‘i ~7 daqiqa
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 420s;
    }
}
```

Tavsiya: botlar uchun `/maqola/` va `/oqituvchi/` yo‘llariga `limit_req` (mavjud bo‘lmagan manzillar ham 404 sifatida diskka keshlanadi).

### 4. Deploy’dan keyin bir martalik ishlar

Bu buyruqlar ham muhitni o‘qiydi — yangi terminalda avval `set -a; . /etc/avtomaqola.env; set +a`.

1. **Telegram webhook:** `npm run bot:webhook` (https `APP_URL`, `TELEGRAM_BOT_TOKEN` va `TELEGRAM_WEBHOOK_SECRET` kerak). Production bot tokeni bilan `npm run bot:poll` ni **hech qayerda** ishga tushirmang: u webhook’ni o‘chirib qo‘yadi (shunday bo‘lsa — `npm run bot:webhook` ni qayta bajaring). Lokal sinov uchun alohida bot oching.
2. **Administrator:** avval odam saytda Telegram orqali ro‘yxatdan o‘tadi, keyin serverda:
   ```bash
   npm run admin -- +998901234567       # /admin — hammasi
   npm run moderator -- +998901234567   # /moderator — faqat maqolalarni ko‘rib chiqish
   ```
   Yangi maqola yuborilganda admin va moderatorlarga Telegram xabari boradi.
3. **Tekshirish:** `https://<domen>/` ochiladi, `https://<domen>/sitemap.xml` va `/robots.txt` to‘g‘ri domen bilan; ro‘yxatdan o‘tish (Telegram kodi keladi), maqola yuborish, admin tasdiqlashi, ommaviy `/maqola/<id>` sahifasi. Sinov maqolasini keyin admin paneldan saytdan olib tashlang — aks holda Google Scholar uni indekslaydi.
4. **Google Search Console:** `https://<domen>/sitemap.xml` ni yuboring.

### 5. Yangi versiyani chiqarish

```bash
cd /opt/avtomaqola
git pull
npm ci --include=dev
set -a; . /etc/avtomaqola.env; set +a
npm run db:migrate               # yangi migratsiyalar bo‘lsa qo‘llanadi (qayta ishga tushirish xavfsiz)
sudo systemctl stop avtomaqola   # build .next papkasini o‘chirib qayta yozadi — ishlab turgan server xato bera boshlaydi
npm run build
sudo systemctl start avtomaqola
```

Build davomida (bir necha daqiqa) sayt ishlamaydi.

### 6. Zenodo (bepul DOI)

1. Avval sinov: [sandbox.zenodo.org](https://sandbox.zenodo.org) da akkaunt → `Settings → Applications → Developer applications → New application`: **Client type: Confidential**, **Redirect URI:** aynan `https://<domen>/api/zenodo/callback`. Client ID/Secret → `ZENODO_*`.
2. Production’ga o‘tishdan **oldin** support@zenodo.org’ga integratsiyani tasvirlab yozing (ilovalar o‘qituvchilar nomidan joylaydi).
3. Production: zenodo.org’da universitetga tegishli akkauntda **alohida** OAuth ilova, `ZENODO_URL=https://zenodo.org`. Sandbox va production yozuvlari bazada alohida saqlanadi.
4. Secret sizib chiqsa — Zenodo’da «Reset client secret».

Sandbox DOI’lari ommaviy sahifaga chiqmaydi — faqat o‘qituvchi kabinetida ko‘rinadi; bu xato emas.

Muhim: zenodo.org Node’ning standart `User-Agent`ini bloklaydi (sandbox bloklamaydi) — kod o‘z `User-Agent`ini yuboradi, uni o‘chirmang.

Avtomatik testlar (`node tests/zenodo/run.mjs`, soxta Zenodo serveri bilan) — **faqat lokal mashinada, production serverda emas**: test o‘zi `next build` qiladi (`.next` qayta yoziladi) va bazaga sinov yozuvlarini qo‘shib, keyin o‘chiradi. Kerak: lokal baza (`db:start` + `db:migrate`), `.env.local`da `AUTH_SECRET`, bo‘sh 3100 va 4010 portlar.

### 7. Zaxira nusxa

- PostgreSQL: muntazam `pg_dump` (barcha foydalanuvchilar, maqolalar, sessiyalar).
- `STORAGE_DIR`: butun papka (PDF’lar, rasmlar). Bazadagi yozuvlar shu fayllarga ishora qiladi — ikkalasi birga tiklanadi.

### 8. Muhim cheklovlar va xavfsizlik

- ⚠️ **Production’da hech qachon `npm run dev` ishlatmang.** Dev rejimida `/admin` va `/moderator` loginsiz ochiq (lokal sinov uchun ataylab qilingan, `src/server/auth/session.ts` → `ADMIN_OPEN`). Production’da faqat admin/moderator roli bilan.
- ⚠️ **`npm run seed:demo` ni production’da ishga tushirmang:** u soxta demo maqola va profillar yaratadi — Google Scholar ularni haqiqiy ilmiy ish deb indekslab qo‘yishi mumkin.
- ⚠️ **Lokal bazani (`.pgdata/`) production’ga ko‘chirmang:** unda demo va sinov ma’lumotlari bor. Production bazasi bo‘sh boshlanadi — `db:migrate` faqat jadvallarni yaratadi.
- **Bitta server jarayoni:** kesh teglari jarayon xotirasida, statik sahifalar va fayllar lokal diskda. Bir nechta nusxa (cluster, bir necha konteyner) kerak bo‘lsa — umumiy `cacheHandler` va obyekt ombori (S3) talab qilinadi.
- `APP_URL` saytning haqiqiy manziliga aynan mos bo‘lishi kerak: so‘rovlarning `Origin` tekshiruvi (CSRF himoyasi) shunga tayanadi.
- Maxfiy qiymatlar (`AUTH_SECRET`, `TELEGRAM_*`, `ANTHROPIC_API_KEY`, `ZENODO_CLIENT_SECRET`) gitga va loglarga tushmasin. `.env.local` gitga kirmaydi.
- AI limiti: o‘qituvchiga kuniga 30 so‘rov va $5 (`src/server/ai/client.ts`); «Internetdagi ma’lumotlarim» — kuniga 3 qidiruv, shu $5 ichida. Xarajatlar `/admin/ai` sahifasida.

### 9. Muammolar

| Belgi | Sabab va yechim |
|---|---|
| Build «APP_URL o‘rnatilmagan» deb to‘xtaydi | Build muhitida `APP_URL` yo‘q — `set -a; . /etc/avtomaqola.env; set +a` dan keyin build qiling |
| Telegram kod kelmaydi | `npm run bot:webhook` natijasi `OK` bo‘lsin; `getWebhookInfo` da xato yo‘qligini tekshiring; nginx `/api/telegram/webhook` ni o‘tkazsin |
| AI javobi uzilib qoladi | nginx’da `/api/articles/` uchun `proxy_read_timeout 300s` va `proxy_buffering off` |
| Zenodo’ga joylashda 504 | nginx’da `/api/zenodo/` uchun `proxy_read_timeout 420s` |
| Fayl yuklashda 413 | nginx `client_max_body_size 11m` |
| Server qayta ishga tushgach rasmlar/PDF yo‘q | `STORAGE_DIR` doimiy absolyut papka emas |

### 10. Topshirish paytidagi holat (2026-10-10)

Tayyor: Telegram orqali kirish, profil, maqola muharriri (AI yordamchi, avtosaqlash), admin/moderator paneli, ommaviy sahifalar (uz, ru, en: `src/app/[lang]/`), yangiliklar, maqola baholash, «Internetdagi ma’lumotlarim» (o‘qituvchi o‘zi haqidagi ma’lumotlarni internetdan qidiradi), Zenodo integratsiyasi (2026-10-09 da soxta server bilan sinovdan o‘tgan).

Ochiq ishlar:
- **Zenodo:** haqiqiy sandbox akkaunt bilan to‘liq sinov hali o‘tkazilmagan; production’dan oldin support@zenodo.org’ga xat. Kod ko‘rigida tasdiqlangan 7 ta kamchilik tuzatilmagan: muvaffaqiyatsiz joylashni kutmasdan qayta boshlash mumkin (cheklov yo‘q), parallel joylashlar bir-biriga xalal berishi mumkin, xato matnlari va ekran o‘quvchi e’lonlari.
- **«Internetdagi ma’lumotlarim»:** haqiqiy (pullik) Claude qidiruvi bilan hali sinalmagan.
- **Kirish imkoniyati (`src/app/globals.css`):** lapis tugmalarda klaviatura fokus halqasi deyarli ko‘rinmaydi; input placeholder kontrasti past (3.1:1).

---

## Lokal ishlab chiqish

Talab: Node.js 22.13+ (yoki 24 LTS). PostgreSQL yoki Docker o‘rnatish shart emas — lokal baza npm paketi ichida keladi.

```bash
npm install
cp .env.example .env.local        # AUTH_SECRET va TELEGRAM_* ni to‘ldiring

npm run db:start                  # 1-terminal: lokal PostgreSQL (localhost:5432)
npm run db:migrate                # jadvallarni yaratadi (yangi migratsiyadan keyin ham)
npm run dev                       # 2-terminal: http://localhost:3000
npm run bot:poll                  # 3-terminal: Telegram bot (lokal rejim)
```

Dev rejimida `/admin` va `/moderator` loginsiz ochiladi. Token bo‘sh bo‘lsa, bot "yuboradigan" xabarlar `npm run dev` konsoliga chiqadi, lekin `bot:poll` tokensiz ishlamaydi — to‘liq kirish oqimi uchun test bot kerak.

### Telegram bot

1. Telegram’da [@BotFather](https://t.me/BotFather) → `/newbot` → token va username oling.
2. `.env.local` ga yozing: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (`@` belgisisiz), `TELEGRAM_WEBHOOK_SECRET` (tasodifiy satr).
3. **Lokal:** `npm run bot:poll` — Telegram’dan xabarlarni olib, `localhost` dagi webhook’ga uzatadi (ngrok kerak emas).
4. **Production:** `APP_URL=https://...` va bir marta `npm run bot:webhook`.

### Kirish qanday ishlaydi

1. Foydalanuvchi saytda ma’lumotlarini kiritadi (kirishda — faqat telefon raqamini).
2. Sayt botga havola beradi: `t.me/<bot>?start=<token>`.
3. Bot kontaktni so‘raydi (kirishda shu Telegram akkaunt bilan ro‘yxatdan o‘tilgan bo‘lsa, so‘ramaydi). Foydalanuvchi **o‘z** raqamini yuboradi, bot uni saytda kiritilgan raqam bilan solishtiradi.
4. Bot 6 xonali kod yuboradi (2 daqiqa amal qiladi), foydalanuvchi uni saytda kiritadi va kabinetga kiradi.

## Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Dev server (faqat lokal!) |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run lint` | ESLint |
| `npm run db:start` | Lokal PostgreSQL (ma’lumotlar `.pgdata/` da) |
| `npm run db:generate` | `src/server/db/schema.ts` o‘zgarganda yangi migratsiya yaratish |
| `npm run db:migrate` | Migratsiyalarni bazaga qo‘llash |
| `npm run db:studio` | Bazani brauzerda ko‘rish (Drizzle Studio) |
| `npm run bot:poll` | Botni lokal rejimda ishga tushirish (webhook’ni o‘chiradi!) |
| `npm run bot:webhook` | Production webhook’ni o‘rnatish |
| `npm run admin -- +998…` | Foydalanuvchini administrator qilish |
| `npm run moderator -- +998…` | Foydalanuvchini moderator qilish |
| `npm run seed:demo` | Demo ma’lumotlar — **faqat lokal** |
| `node tests/zenodo/run.mjs` | Zenodo integratsiyasi testlari — **faqat lokal** (6-bo‘lim) |

## Tuzilma

```
src/app/[lang]/          ommaviy sahifalar (uz — prefikssiz, /ru, /en)
src/app/(auth)/          kirish va ro‘yxatdan o‘tish
src/app/dashboard/       o‘qituvchi kabineti: maqolalar, muharrir, profil
src/app/admin/           admin panel;  src/app/moderator/ — moderator
src/app/api/             API: auth, maqolalar, AI, Zenodo, Telegram webhook
src/app/media/           yuklangan rasmlarni berish; maqola PDF’i — src/app/maqola/[id]/pdf/
src/components/          UI komponentlar
src/i18n/                uz/ru/en matnlar
src/lib/                 klient va server uchun umumiy kod (validatsiya, tiplar)
src/server/              server mantiqi: auth, articles, ai, zenodo, telegram, orcid, db…
src/proxy.ts             til yo‘nalishi va sessiyani yangilash (middleware o‘rnida)
drizzle/                 SQL migratsiyalar
scripts/                 lokal baza, bot va rol skriptlari
tests/zenodo/            Zenodo integratsiyasi testlari
docs/ARCHITECTURE.md     arxitektura va reja
PRODUCT.md, DESIGN.md    mahsulot va dizayn tizimi
```
