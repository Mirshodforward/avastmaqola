// Lokal ishlab chiqish uchun demo: 4 ta o‘qituvchi profili va ularning chop etilgan maqolalari
// (bosh sahifadagi "So‘nggi maqolalar", /maqolalar, maqola va profil sahifalari dizaynini ko‘rish uchun).
//   npm run seed:demo              — yaratish (oldingi demo o‘chirilib, qaytadan yoziladi)
//   npm run seed:demo -- --remove  — o‘chirish
// FAQAT lokal bazaga: haqiqiy saytda soxta maqolalar citation_* teglari orqali Google Scholar’ga
// haqiqiy ilmiy ish sifatida tushib qolardi.
import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import pg from "pg";

nextEnv.loadEnvConfig(process.cwd(), true);

const host = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();
if (!["localhost", "127.0.0.1", "[::1]"].includes(host) || process.env.NODE_ENV === "production") {
  console.error("Demo maqolalar faqat lokal bazaga yoziladi (DATABASE_URL localhost bo‘lishi kerak).");
  process.exit(1);
}

const STORAGE = path.resolve(process.env.STORAGE_DIR ?? "storage", "articles");
const UNI = "Asman Universiteti";

const DEMO = [
  {
    user: { firstName: "Dilnoza", lastName: "Karimova", phone: "+998900000101", slug: "dilnoza-karimova" },
    profile: {
      position: "Dotsent",
      degree: "phd",
      department: "Axborot texnologiyalari kafedrasi",
      direction: "Kompyuter lingvistikasi",
      bio: "O‘zbek tilini kompyuterda qayta ishlash, matn tasnifi va mashinaviy tarjima bo‘yicha tadqiqotlar olib boradi.",
      keywords: ["sun’iy intellekt", "kompyuter lingvistikasi", "o‘zbek tili"],
    },
    daysAgo: 2,
    lang: "uz",
    title: {
      uz: "O‘zbek tilidagi matnlarni sun’iy intellekt yordamida avtomatik tasniflash",
      ru: "Автоматическая классификация текстов на узбекском языке с помощью искусственного интеллекта",
      en: "Automatic classification of Uzbek-language texts using artificial intelligence",
    },
    abstract: {
      uz: "Maqolada o‘zbek tilidagi yangilik matnlarini mavzular bo‘yicha avtomatik tasniflash uchun transformer arxitekturasiga asoslangan model taklif etiladi. Tadqiqot uchun 48 ming hujjatdan iborat korpus to‘plandi, lotin va kirill yozuvidagi matnlar yagona ko‘rinishga keltirildi. Taklif etilgan model an’anaviy TF-IDF va SVM usullariga nisbatan F1 ko‘rsatkichi bo‘yicha 9 foizga yuqori natija ko‘rsatdi. Natijalar davlat xizmatlarida murojaatlarni avtomatik saralashda qo‘llanilishi mumkin.",
      ru: "В статье предлагается модель на основе архитектуры трансформер для автоматической тематической классификации новостных текстов на узбекском языке. Для исследования собран корпус из 48 тысяч документов, тексты на латинице и кириллице приведены к единому виду. Предложенная модель превзошла традиционные методы TF-IDF и SVM на 9 процентов по метрике F1. Результаты могут применяться для автоматической сортировки обращений в государственных службах.",
      en: "The article proposes a transformer-based model for automatic topic classification of Uzbek-language news texts. A corpus of 48 thousand documents was collected, and texts written in the Latin and Cyrillic scripts were normalised to a single form. The proposed model outperformed traditional TF-IDF and SVM methods by 9 percentage points in F1 score. The results can be applied to the automatic routing of citizen requests in public services.",
    },
    keywords: {
      uz: ["sun’iy intellekt", "matn tasnifi", "o‘zbek tili", "transformer"],
      ru: ["искусственный интеллект", "классификация текстов", "узбекский язык", "трансформер"],
      en: ["artificial intelligence", "text classification", "Uzbek language", "transformer"],
    },
    coauthors: [{ given: "Jasur", family: "Toshmatov", institution: UNI }],
  },
  {
    user: { firstName: "Aziz", lastName: "Rahimov", phone: "+998900000102", slug: "aziz-rahimov" },
    profile: {
      position: "Katta o‘qituvchi",
      degree: null,
      department: "Pedagogika va psixologiya kafedrasi",
      direction: "Ta’lim texnologiyalari",
      bio: "Raqamli ta’lim platformalari va moslashuvchan o‘qitish usullarini o‘rganadi.",
      keywords: ["raqamli ta’lim", "pedagogika"],
    },
    daysAgo: 9,
    lang: "ru",
    title: {
      uz: "Raqamli ta’lim platformalarining muhandislik yo‘nalishi talabalari o‘zlashtirishiga ta’siri",
      ru: "Влияние цифровых образовательных платформ на успеваемость студентов инженерных направлений",
      en: "The impact of digital learning platforms on the academic performance of engineering students",
    },
    abstract: {
      uz: "Tadqiqot raqamli ta’lim platformalarining muhandislik yo‘nalishi talabalari o‘zlashtirishiga ta’sirini baholashga bag‘ishlangan. Tajribada ikki kursning 312 nafar talabasi qatnashdi, ularning yarmi semestr davomida moslashuvchan topshiriqlarga ega platformadan foydalandi. Tajriba guruhining o‘rtacha bali 11 foizga yuqori bo‘ldi, akademik qarzdor talabalar ulushi esa deyarli ikki baravar kamaydi. Raqamli platformalarni o‘qituvchining muntazam maslahatlari bilan uyg‘unlashtirish maqsadga muvofiqligi xulosa qilindi.",
      ru: "Исследование посвящено оценке влияния цифровых образовательных платформ на успеваемость студентов инженерных направлений. В эксперименте участвовали 312 студентов двух курсов, половина из которых в течение семестра использовала платформу с адаптивными заданиями. Средний балл экспериментальной группы оказался выше на 11 процентов, а доля студентов с задолженностями снизилась почти вдвое. Сделан вывод о целесообразности сочетания цифровых платформ с регулярными консультациями преподавателя.",
      en: "The study evaluates the impact of digital learning platforms on the academic performance of engineering students. The experiment involved 312 students from two years of study, half of whom used a platform with adaptive assignments for one semester. The average grade of the experimental group was 11 percent higher, and the share of students with academic debts fell almost by half. The authors conclude that digital platforms work best when combined with regular consultations with the teacher.",
    },
    keywords: {
      uz: ["raqamli ta’lim", "o‘zlashtirish", "moslashuvchan ta’lim"],
      ru: ["цифровое образование", "успеваемость", "адаптивное обучение"],
      en: ["digital education", "academic performance", "adaptive learning"],
    },
    coauthors: [{ given: "Kamola", family: "Ergasheva", institution: UNI }],
  },
  {
    user: { firstName: "Bobur", lastName: "Yusupov", phone: "+998900000103", slug: "bobur-yusupov" },
    profile: {
      position: "Professor",
      degree: "dsc",
      department: "Agronomiya kafedrasi",
      direction: "Qishloq xo‘jaligi va suv resurslari",
      bio: "Suv tejovchi sug‘orish texnologiyalari va sho‘rlangan yerlarda dehqonchilik bo‘yicha 20 yildan ortiq tadqiqot tajribasiga ega.",
      keywords: ["sug‘orish", "suv resurslari", "agronomiya"],
    },
    daysAgo: 17,
    lang: "en",
    title: {
      uz: "Orolbo‘yi hududida g‘o‘zani suv tejovchi tomchilatib sug‘orish: uch yillik dala tadqiqoti",
      ru: "Водосберегающее капельное орошение хлопчатника в Приаралье: трёхлетнее полевое исследование",
      en: "Water-saving drip irrigation of cotton in the Aral Sea region: a three-year field study",
    },
    abstract: {
      uz: "Orolbo‘yi hududidagi suv tanqisligi hosildorlikni pasaytirmasdan suv sarfini kamaytiradigan sug‘orish usullarini talab qiladi. Uch yillik dala tadqiqotida Qoraqalpog‘istonning sho‘rlangan tuproqlarida g‘o‘zani tomchilatib va an’anaviy egat orqali sug‘orish taqqoslandi. Tomchilatib sug‘orish suv sarfini o‘rtacha 38 foizga kamaytirdi va paxta hosildorligini 14 foizga oshirdi, ildiz qatlamidagi sho‘rlanish esa barqaror qoldi. Iqtisodiy tahlil sarmoya to‘rt mavsumda qoplanishini ko‘rsatadi.",
      ru: "Дефицит воды в Приаралье требует методов орошения, которые снижают расход воды без потери урожая. В трёхлетнем полевом исследовании на засолённых почвах Каракалпакстана сравнивались капельное и традиционное бороздковое орошение хлопчатника. Капельное орошение снизило расход воды в среднем на 38 процентов и повысило урожайность хлопка-сырца на 14 процентов, засолённость корнеобитаемого слоя оставалась стабильной. Экономический анализ показывает окупаемость вложений за четыре сезона.",
      en: "Water scarcity in the Aral Sea region requires irrigation methods that reduce water use without lowering yields. This three-year field study compared drip irrigation with conventional furrow irrigation of cotton on saline soils in Karakalpakstan. Drip irrigation reduced water consumption by 38 percent and increased raw cotton yield by 14 percent on average, while soil salinity in the root zone remained stable. An economic analysis shows that the investment pays back within four seasons.",
    },
    keywords: {
      uz: ["tomchilatib sug‘orish", "g‘o‘za", "suv tejash", "Orolbo‘yi"],
      ru: ["капельное орошение", "хлопчатник", "водосбережение", "Приаралье"],
      en: ["drip irrigation", "cotton", "water saving", "Aral Sea", "soil salinity"],
    },
    coauthors: [
      { given: "Nilufar", family: "Saidova", institution: UNI },
      { given: "Rustam", family: "Ergashev", institution: "Qoraqalpoq davlat universiteti" },
    ],
  },
  {
    user: { firstName: "Malika", lastName: "Qodirova", phone: "+998900000104", slug: "malika-qodirova" },
    profile: {
      position: "O‘qituvchi",
      degree: null,
      department: "Tarix va madaniy meros kafedrasi",
      direction: "Madaniy merosni raqamlashtirish",
      bio: "Me’moriy yodgorliklarni fotogrammetriya va 3D texnologiyalar yordamida hujjatlashtirish bilan shug‘ullanadi.",
      keywords: ["madaniy meros", "3D modellashtirish"],
    },
    daysAgo: 26,
    lang: "uz",
    title: {
      uz: "Samarqand me’moriy yodgorliklarini raqamli 3D modellashtirish va saqlash usullari",
      ru: "Методы цифрового 3D-моделирования и сохранения архитектурных памятников Самарканда",
      en: "Methods of digital 3D modelling and preservation of the architectural monuments of Samarkand",
    },
    abstract: {
      uz: "Maqolada Samarqanddagi me’moriy yodgorliklarni fotogrammetriya va lazerli skanerlash yordamida raqamli 3D modellashtirish tajribasi bayon etiladi. Registon ansambli va Shohi Zinda majmuasidagi o‘n ikki obyekt uchun yuqori aniqlikdagi modellar yaratildi. Bu modellar koshinlardagi yoriqlar va rang o‘zgarishlarini yillar davomida kuzatish imkonini beradi. Shuningdek, modellarni ochiq formatlarda saqlash va muzey ekspozitsiyalarida virtual sayohat sifatida taqdim etish bo‘yicha tavsiyalar ishlab chiqildi.",
      ru: "В статье описан опыт цифрового 3D-моделирования архитектурных памятников Самарканда с помощью фотограмметрии и лазерного сканирования. Созданы высокоточные модели двенадцати объектов ансамбля Регистан и комплекса Шахи-Зинда. Эти модели позволяют отслеживать трещины и изменение цвета изразцов на протяжении многих лет. Также разработаны рекомендации по хранению моделей в открытых форматах и их представлению в музейных экспозициях в виде виртуальных экскурсий.",
      en: "The article describes the digital 3D modelling of architectural monuments in Samarkand using photogrammetry and laser scanning. High-precision models were created for twelve structures of the Registan ensemble and the Shah-i-Zinda complex. The models make it possible to monitor cracks and colour changes in the glazed tiles over many years. The authors also propose recommendations for storing the models in open formats and presenting them as virtual tours in museum exhibitions.",
    },
    keywords: {
      uz: ["madaniy meros", "3D modellashtirish", "fotogrammetriya", "Samarqand"],
      ru: ["культурное наследие", "3D-моделирование", "фотограмметрия", "Самарканд"],
      en: ["cultural heritage", "3D modelling", "photogrammetry", "Samarkand"],
    },
    coauthors: [],
  },
];

const PHONES = DEMO.map((d) => d.user.phone);

/** Bir sahifali haqiqiy PDF (Helvetica, faqat lotin): sarlavha, mualliflar, "DEMO" belgisi va annotatsiya */
function demoPdf(item) {
  const ascii = (s) => s.normalize("NFKD").replace(/[‘’ʻʼ`]/g, "'").replace(/[^\x20-\x7E]/g, "");
  const wrap = (text, width) => {
    const lines = [];
    let line = "";
    for (const word of ascii(text).split(" ")) {
      if ((line + " " + word).trim().length > width) {
        lines.push(line);
        line = word;
      } else line = (line + " " + word).trim();
    }
    return line ? [...lines, line] : lines;
  };
  const authors = [`${item.user.firstName} ${item.user.lastName}`, ...item.coauthors.map((a) => `${a.given} ${a.family}`)];
  const rows = [
    [16, wrap(item.title.en, 60)],
    [11, [authors.join(", "), UNI]],
    [10, ["DEMO - local development sample, not a real scientific paper."]],
    [11, ["Abstract"]],
    [10, wrap(item.abstract.en, 95)],
  ];
  const esc = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  let y = 790;
  const ops = [];
  for (const [size, lines] of rows) {
    for (const line of lines) {
      ops.push(`BT /F1 ${size} Tf 56 ${y} Td (${esc(line)}) Tj ET`);
      y -= size + 8;
    }
    y -= 10;
  }
  const content = ops.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];
  let out = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const offset = Buffer.byteLength(out, "latin1");
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

async function removeDemo(db) {
  const { rows } = await db.query(
    "select a.pdf_key from articles a join users u on u.id = a.user_id where u.phone = any($1) and a.pdf_key is not null",
    [PHONES],
  );
  for (const r of rows) await rm(path.join(STORAGE, r.pdf_key), { force: true });
  await db.query("delete from articles where user_id in (select id from users where phone = any($1))", [PHONES]);
  const { rowCount } = await db.query("delete from users where phone = any($1)", [PHONES]); // profillar cascade
  return rowCount;
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  const removed = await removeDemo(db);
  if (process.argv.includes("--remove")) {
    console.log(`Demo o‘chirildi: ${removed} ta o‘qituvchi va ularning maqolalari.`);
  } else {
    await mkdir(STORAGE, { recursive: true });
    await db.query("begin");
    for (const item of DEMO) {
      const { user, profile } = item;
      const { rows: [u] } = await db.query(
        "insert into users (first_name, last_name, phone) values ($1, $2, $3) returning id",
        [user.firstName, user.lastName, user.phone],
      );
      await db.query(
        `insert into profiles (user_id, slug, position, academic_degree, institution, department, direction, bio, keywords)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [u.id, user.slug, profile.position, profile.degree, UNI, profile.department, profile.direction, profile.bio, profile.keywords],
      );
      const pdf = demoPdf(item);
      const pdfKey = `demo-${randomBytes(8).toString("hex")}.pdf`;
      await writeFile(path.join(STORAGE, pdfKey), pdf);
      const { rows: [a] } = await db.query(
        `insert into articles (user_id, status, lang, title_uz, title_ru, title_en, abstract_uz, abstract_ru, abstract_en,
           keywords_uz, keywords_ru, keywords_en, license, rights_confirmed_at, pdf_key, pdf_bytes,
           submitted_at, reviewed_at, published_at)
         values ($1, 'published', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'cc-by-4.0', now(), $12, $13,
           now() - make_interval(days => $14 + 2), now() - make_interval(days => $14), now() - make_interval(days => $14))
         returning id`,
        [
          u.id, item.lang, item.title.uz, item.title.ru, item.title.en,
          item.abstract.uz, item.abstract.ru, item.abstract.en,
          item.keywords.uz, item.keywords.ru, item.keywords.en,
          pdfKey, pdf.length, item.daysAgo,
        ],
      );
      const authors = [
        { given: user.firstName, family: user.lastName, institution: UNI, userId: u.id },
        ...item.coauthors.map((c) => ({ ...c, userId: null })),
      ];
      for (const [i, au] of authors.entries()) {
        await db.query(
          "insert into article_authors (article_id, position, user_id, given_name, family_name, institution) values ($1, $2, $3, $4, $5, $6)",
          [a.id, i + 1, au.userId, au.given, au.family, au.institution],
        );
      }
      console.log(`№${a.id}  ${item.title[item.lang]}  —  /oqituvchi/${user.slug}`);
    }
    await db.query("commit");
    console.log("\nDemo tayyor. Ishlab turgan dev serverda ro‘yxatlar keshdan keladi: yangilanishi uchun serverni qayta ishga tushiring.");
  }
} catch (error) {
  await db.query("rollback").catch(() => {});
  throw error;
} finally {
  await db.end();
}
