// Zenodo integratsiyasining qora quti testlari. Alohida production server (next build + next start -p 3100)
// sinov Zenodo’ga (mock.mjs, 4010-port) qarab ishlaydi. Umumiy dev server (:3000) va Postgres sozlamalariga
// tegilmaydi: bazaga faqat o‘z fixture’lari (+99893777… telefonli o‘qituvchilar) yoziladi va oxirida o‘chiriladi.
//   node tests/zenodo/run.mjs                          — build va testlar
//   ZENODO_TEST_SKIP_BUILD=1 node tests/zenodo/run.mjs — .next’dagi build bilan (faqat uni hozirgina o‘zingiz yig‘gan bo‘lsangiz)
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import pg from "pg";
import { MOCK_CLIENT, startMock } from "./mock.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../..");
const NEXT = path.join(ROOT, "node_modules/next/dist/bin/next");
const PORT = 3100;
const APP = `http://localhost:${PORT}`;
const MOCK_PORT = 4010;
const HOST = `127.0.0.1:${MOCK_PORT}`; // zenodo_deposits.host
const CALLBACK = `${APP}/api/zenodo/callback`;
const UA = `Avtomaqola/1.0 (+${APP})`;
const VND = "application/vnd.inveniordm.v1+json";
const PHONES = "+99893777%";
const SECRETS = ["mock-at-", "mock-rt-", MOCK_CLIENT.secret];
const UNI = "Asman Universiteti";
const SERVER_LOG = path.join(os.tmpdir(), "avtomaqola-zenodo-next.log");

nextEnv.loadEnvConfig(ROOT, true);
// Faqat lokal bazaga (seed-demo.mjs bilan bir xil himoya)
const dbHost = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();
if (!["localhost", "127.0.0.1", "[::1]"].includes(dbHost) || process.env.NODE_ENV === "production") {
  console.error("Zenodo testlari faqat lokal bazada ishlaydi (DATABASE_URL localhost bo‘lishi kerak).");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const md5 = (data) => createHash("md5").update(data).digest("hex");
const parse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

let db;
let mock;
let server;
let storage;
let serverLog = "";
const seen = []; // ilova qaytargan har bir javob matni: token yoki sir sizib chiqmaganini tekshirish uchun
const users = {};
const art = {};
let mark = 0;
let firstA1; // 7-holatdagi oqim (9-holat uni qayta o‘ynaydi)

const portFree = (port) =>
  new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.end();
      resolve(false);
    });
    socket.once("error", () => resolve(true));
  });

async function waitForApp() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`next start to‘xtadi:\n${serverLog}`);
    const res = await fetch(`${APP}/login`).catch(() => null);
    await res?.arrayBuffer();
    if (res?.status === 200) return;
    await sleep(500);
  }
  throw new Error(`next start 60 soniyada javob bermadi:\n${serverLog}`);
}

// Soxta Telegram id: after() dagi xabarnoma ishga tushadi, bo‘sh bot tokeni bilan esa hech kimga yetmaydi
// (token bo‘sh bo‘lmasa ham Telegram "chat not found" qaytaradi)
const fakeChat = () => 9_000_000_000_000 + Math.floor(Math.random() * 1_000_000_000);

async function addUser(firstName, phone, { role = "teacher", chat = null } = {}) {
  const {
    rows: [u],
  } = await db.query("insert into users (first_name, last_name, phone, role, telegram_user_id) values ($1, 'Sinov', $2, $3, $4) returning id", [
    firstName,
    phone,
    role,
    chat,
  ]);
  // Sessiya va access token — ilova imzolagandek: {sid}.{exp}.{HMAC(AUTH_SECRET, "access:{sid}.{exp}")}
  const sid = randomUUID();
  await db.query("insert into sessions (id, user_id, token_hash, expires_at) values ($1, $2, $3, now() + interval '1 day')", [
    sid,
    u.id,
    randomBytes(32).toString("hex"),
  ]);
  const payload = `${sid}.${Math.floor(Date.now() / 1000) + 4 * 3600}`;
  const token = `${payload}.${createHmac("sha256", process.env.AUTH_SECRET).update(`access:${payload}`).digest("base64url")}`;
  // Production’da cookie nomi __Host- prefiksli; dev’dagisi ham yuboriladi
  return { id: u.id, cookie: `__Host-am_session=${token}; am_session=${token}` };
}

async function addArticle(owner, name, o = {}) {
  const pdf = Buffer.from(`%PDF-1.4\n% Avtomaqola Zenodo test ${name} ${randomBytes(4).toString("hex")}\n%%EOF\n`, "latin1");
  const pdfKey = `zt-${randomBytes(8).toString("hex")}.pdf`;
  await writeFile(path.join(storage, "articles", pdfKey), pdf);
  const titles = {
    uz: `Zenodo sinovi ${name}: o‘zbek tilidagi maqola`,
    ru: `Тест Zenodo ${name}: статья на узбекском языке`,
    en: `Zenodo test ${name}: an Uzbek-language article`,
  };
  const status = o.status ?? "published";
  const day = new Date(Date.now() - 86_400_000);
  const {
    rows: [a],
  } = await db.query(
    `insert into articles (user_id, status, lang, title_uz, title_ru, title_en, abstract_uz, abstract_ru, abstract_en,
       keywords_uz, keywords_ru, keywords_en, license, rights_confirmed_at, pdf_key, pdf_bytes, doi,
       submitted_at, reviewed_at, published_at)
     values ($1, $2, 'uz', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), $13, $14, $15, now() - interval '2 days', $16, $17)
     returning id`,
    [
      owner.id,
      status,
      titles.uz,
      titles.ru,
      titles.en,
      o.abstractUz ?? `Sinov maqolasi ${name} annotatsiyasi.`,
      "Аннотация тестовой статьи для проверки Zenodo.",
      "Abstract of a test article for the Zenodo check.",
      o.keywords?.uz ?? ["sinov", name],
      o.keywords?.ru ?? ["тест"],
      o.keywords?.en ?? ["test"],
      o.license ?? "cc-by-4.0",
      pdfKey,
      pdf.length,
      o.doi ?? null,
      status === "published" ? day : null,
      status === "published" ? (o.publishedAt ?? day) : null,
    ],
  );
  const authors = o.authors ?? [{ given: "Zenodo", family: "Sinov", institution: UNI, userId: owner.id }];
  for (const [i, x] of authors.entries()) {
    await db.query(
      "insert into article_authors (article_id, position, user_id, given_name, family_name, institution, orcid) values ($1, $2, $3, $4, $5, $6, $7)",
      [a.id, i + 1, x.userId ?? null, x.given, x.family, x.institution ?? null, x.orcid ?? null],
    );
  }
  return { id: a.id, md5: md5(pdf), titles, key: `maqola-${a.id}.pdf` };
}

async function seed() {
  await mkdir(path.join(storage, "articles"), { recursive: true });
  users.A = await addUser("ZenodoA", "+998937770001", { chat: fakeChat() });
  users.B = await addUser("ZenodoB", "+998937770002");
  users.admin = await addUser("ZenodoAdmin", "+998937770009", { role: "admin", chat: fakeChat() });
  art.a1 = await addArticle(users.A, "A1", {
    abstractUz: "Birinchi xatboshi: <b>& belgilari saqlanadi.\nShu xatboshining ikkinchi qatori.\n\nIkkinchi xatboshi.",
    keywords: {
      uz: ["sun’iy intellekt", "Transformer", "matn"],
      ru: ["искусственный интеллект", "трансформер", "текст"],
      en: ["artificial intelligence", "transformer", "text"],
    },
    publishedAt: "2026-03-04T20:30:00Z", // Toshkentda 5-mart 01:30, UTC bo‘yicha hali 4-mart
    authors: [
      { given: "Dilnoza", family: "Karimova", institution: UNI, orcid: "0000-0002-1825-0097", userId: users.A.id },
      { given: "Jasur", family: "Toshmatov", institution: UNI },
    ],
  });
  art.a2 = await addArticle(users.A, "A2", { license: "all-rights-reserved" });
  await db.query("insert into ai_requests (user_id, article_id, status, model, proposed_fields) values ($1, $2, 'ok', 'test', 3)", [
    users.A.id,
    art.a2.id,
  ]);
  art.a3 = await addArticle(users.A, "A3", { doi: "10.1234/test.1" });
  art.a4 = await addArticle(users.A, "A4", { status: "draft" });
  for (const name of ["c11", "c12", "c13", "c14", "c15", "c16", "c17", "c18", "c19", "c19b", "c21", "c22", "c22b", "c23"]) {
    art[name] = await addArticle(users.A, name);
  }
  art.b1 = await addArticle(users.B, "B1");
}

async function removeFixtures() {
  // Mualliflar va zenodo_deposits maqola bilan, sessiyalar va ai_requests foydalanuvchi bilan (cascade) o‘chadi
  await db.query("delete from articles where user_id in (select id from users where phone like $1)", [PHONES]);
  await db.query("delete from users where phone like $1", [PHONES]);
}

before(async () => {
  for (const port of [PORT, MOCK_PORT]) assert.ok(await portFree(port), `${port}-port band: avval u yerdagi jarayonni to‘xtating`);
  db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await removeFixtures(); // oldingi uzilgan yugurishdan qolganlari
  storage = await mkdtemp(path.join(os.tmpdir(), "avtomaqola-zenodo-"));
  mock = await startMock({ port: MOCK_PORT, redirectUris: [CALLBACK] });

  // Bo‘sh bot tokeni: production’da sendMessage xato beradi, notify uni faqat logga yozadi — Telegram’ga hech narsa ketmaydi
  const env = {
    ...process.env,
    APP_URL: APP,
    ZENODO_URL: mock.url,
    ZENODO_CLIENT_ID: MOCK_CLIENT.id,
    ZENODO_CLIENT_SECRET: MOCK_CLIENT.secret,
    STORAGE_DIR: storage,
    TELEGRAM_BOT_TOKEN: "",
  };
  delete env.NODE_ENV;
  if (process.env.ZENODO_TEST_SKIP_BUILD !== "1") {
    const build = spawnSync(process.execPath, [NEXT, "build"], { cwd: ROOT, env, stdio: "inherit" });
    assert.equal(build.status, 0, "next build xato bilan tugadi");
  }
  server = spawn(process.execPath, [NEXT, "start", "-p", String(PORT)], { cwd: ROOT, env });
  for (const stream of [server.stdout, server.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (d) => (serverLog += d));
  }
  await waitForApp();
  await seed();
});

after(async () => {
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    // Windows’da next start bola jarayonlari bilan birga to‘xtatiladi
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    else server.kill();
    await exited;
  }
  await mock?.close();
  if (db) {
    await removeFixtures();
    const { rows } = await db.query("select count(*)::int as n from users where phone like $1", [PHONES]);
    await db.end();
    assert.equal(rows[0].n, 0, "fixture foydalanuvchilar o‘chmadi");
  }
  if (storage) await rm(storage, { recursive: true, force: true });
  await writeFile(SERVER_LOG, serverLog);
  console.log(`# next start logi: ${SERVER_LOG}`);
});

beforeEach(() => {
  mock?.reset();
  mark = mock?.log().length ?? 0;
});

const since = () => mock.log().slice(mark);
const calls = (log) => log.map((e) => `${e.method} ${e.path}`);
/** Server→Zenodo so‘rovlari (authorize — brauzer navigatsiyasi, testning o‘zi bosadi) */
const s2s = (log) => log.filter((e) => e.path !== "/oauth/authorize");
const cookieOf = (...parts) => parts.filter(Boolean).join("; ");

async function page(user, pathname) {
  const res = await fetch(APP + pathname, { headers: { cookie: cookieOf(user?.cookie) }, redirect: "manual" });
  const html = await res.text();
  seen.push(html);
  return { status: res.status, html };
}

/** Panel klientga beradigan xesh (o‘qituvchi ko‘rib tasdiqlaydigan yozuv) — kabinet sahifasining RSC ma’lumotidan */
async function hashOf(user, id) {
  const { status, html } = await page(user, `/dashboard/articles/${id}`);
  assert.equal(status, 200, `kabinet ${id}: ${status}`);
  const found = html.match(/hash\\?":\\?"([\w-]{43})\\?"/);
  assert.ok(found, `kabinet ${id}: Zenodo panelida hash yo‘q`);
  return found[1];
}

async function start(user, id, body, origin = APP) {
  const res = await fetch(`${APP}/api/articles/${id}/zenodo`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: cookieOf(user?.cookie) },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  seen.push(text);
  const setCookie = res.headers.getSetCookie().find((c) => c.startsWith("am_zenodo="));
  return { status: res.status, json: parse(text), setCookie, flow: setCookie?.split(";")[0] };
}

/** Brauzer Zenodo’da «Authorize» bosgandek: mock callback manzilini (code, state) qaytaradi */
async function authorize(url) {
  const res = await fetch(url, { redirect: "manual" });
  assert.equal(res.status, 302, `authorize: ${res.status}`);
  return new URL(res.headers.get("location"));
}

async function callback(loc, user, flow) {
  const res = await fetch(CALLBACK + loc.search, { headers: { cookie: cookieOf(user?.cookie, flow) }, redirect: "manual" });
  seen.push(await res.text());
  const location = res.headers.get("location");
  const to = location ? new URL(location) : null;
  return {
    status: res.status,
    to: to ? to.pathname + to.search : null,
    origin: to?.origin ?? null,
    setCookie: res.headers.getSetCookie().find((c) => c.startsWith("am_zenodo=")),
  };
}

/** O‘qituvchining to‘liq yo‘li: panel → start → Zenodo’da ruxsat → callback */
async function deposit(user, id) {
  const hash = await hashOf(user, id);
  const s = await start(user, id, { rights: true, hash });
  assert.equal(s.status, 200, JSON.stringify(s.json));
  const cb = await callback(await authorize(s.json.url), user, s.flow);
  return { ...cb, hash, flow: s.flow, url: s.json.url };
}

async function row(id) {
  const { rows } = await db.query("select * from zenodo_deposits where article_id = $1 and host = $2", [id, HOST]);
  return rows[0] ?? null;
}

async function expectFailed(id, code) {
  const r = await row(id);
  assert.equal(r?.status, "failed", JSON.stringify(r));
  assert.equal(r.error, code);
  return r;
}

async function expectPublished(id) {
  const r = await row(id);
  assert.equal(r?.status, "published", JSON.stringify(r));
  assert.match(r.doi, /^10\.5072\/zenodo\.\d+$/);
  assert.ok(r.record_id);
  assert.equal(r.error, null);
  return r;
}

/** Yangi yozuvning beshta chaqiruvi */
const fresh = (recordId, key) => [
  "POST /api/records",
  `POST /api/records/${recordId}/draft/files`,
  `PUT /api/records/${recordId}/draft/files/${key}/content`,
  `POST /api/records/${recordId}/draft/files/${key}/commit`,
  `POST /api/records/${recordId}/draft/actions/publish`,
];

/** Har bir maqolaga Zenodo’da ko‘pi bilan bitta chop etilgan yozuv */
function assertOnePublishedPerArticle() {
  const count = {};
  for (const r of mock.records()) {
    if (r.state === "published") for (const key of r.keys) count[key] = (count[key] ?? 0) + 1;
  }
  for (const [key, n] of Object.entries(count)) assert.equal(n, 1, `${key}: ${n} ta chop etilgan yozuv`);
}

async function until(check, ms = 15_000) {
  const deadline = Date.now() + ms;
  while (!check()) {
    assert.ok(Date.now() < deadline, "kutish muddati tugadi");
    await sleep(25);
  }
}

const DUMMY = "x".repeat(43);

test("0. mock zenodo.org qoidalarini bajaradi", async () => {
  const m = await startMock({ port: MOCK_PORT + 1, redirectUris: ["http://localhost:1/cb"] });
  try {
    const form = { "content-type": "application/x-www-form-urlencoded" };
    // Node fetch’ning standart UA’si ("node") — HTML 403
    let res = await fetch(`${m.url}/oauth/token`, { method: "POST", headers: form, body: "grant_type=authorization_code" });
    assert.equal(res.status, 403);
    assert.match(res.headers.get("content-type"), /html/);
    const ua = { "user-agent": "Avtomaqola-check" };
    res = await fetch(`${m.url}/oauth/token`, {
      method: "POST",
      headers: { ...form, ...ua },
      body: `grant_type=authorization_code&code=nope&client_id=${MOCK_CLIENT.id}&client_secret=${MOCK_CLIENT.secret}&redirect_uri=x`,
    });
    assert.deepEqual([res.status, await res.json()], [400, { error: "invalid_grant" }]);
    res = await fetch(`${m.url}/oauth/token`, { method: "POST", headers: { ...form, ...ua }, body: "client_id=other" });
    assert.equal(res.status, 404);
    assert.match(res.headers.get("content-type"), /html/);
    res = await fetch(`${m.url}/api/records`, { method: "POST", headers: { ...ua, accept: VND } });
    assert.deepEqual([res.status, (await res.json()).message], [403, "Permission denied."]);
  } finally {
    await m.close();
  }
});

test("1. start: himoya va maqola holatlari", async () => {
  const id = art.a1.id;
  const body = { rights: true, hash: DUMMY };
  assert.equal((await start(users.A, id, body, "https://evil.example")).status, 403);
  assert.equal((await start(null, id, body)).status, 401);
  assert.equal((await start(users.B, id, body)).status, 404); // begona maqola
  assert.equal((await start(users.A, art.a4.id, body)).status, 409); // qoralama
  assert.equal((await start(users.A, art.a3.id, body)).status, 409); // nashriyot DOI’si bor
  const noRights = await start(users.A, id, { hash: DUMMY });
  assert.equal(noRights.status, 400);
  assert.ok(noRights.json?.error?.fieldErrors?.rights, JSON.stringify(noRights.json));
  const stale = await start(users.A, id, body); // eskirgan sahifa (xesh boshqa)
  assert.equal(stale.status, 409);
  assert.equal(stale.json.error.code, "state_conflict");
  assert.equal(stale.setCookie, undefined);
  assert.deepEqual(since(), []); // Zenodo’ga hech narsa ketmadi
});

test("2. start: Zenodo havolasi va oqim cookie’si", async () => {
  const id = art.a1.id;
  const hash = await hashOf(users.A, id);
  const r = await start(users.A, id, { rights: true, hash });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const url = new URL(r.json.url);
  assert.equal(url.host, HOST);
  assert.equal(url.pathname, "/oauth/authorize");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("client_id"), MOCK_CLIENT.id);
  assert.equal(url.searchParams.get("scope"), "deposit:write deposit:actions");
  assert.equal(url.searchParams.get("redirect_uri"), CALLBACK);
  assert.match(url.searchParams.get("state"), /^[\w-]{43}$/);
  assert.match(r.setCookie, new RegExp(`^am_zenodo=${id}\\.[\\w-]{43}\\.${hash};`));
  for (const part of [/;\s*Path=\/api\/zenodo(;|$)/i, /;\s*HttpOnly/i, /;\s*SameSite=Lax/i, /;\s*Max-Age=3600/i, /;\s*Secure/i]) {
    assert.match(r.setCookie, part);
  }
  assert.deepEqual(since(), []);
});

test("3. callback: soxta state — Zenodo’ga so‘rov yo‘q", async () => {
  const id = art.a1.id;
  const s = await start(users.A, id, { rights: true, hash: await hashOf(users.A, id) });
  const loc = await authorize(s.json.url);
  const state = loc.searchParams.get("state");
  loc.searchParams.set("state", (state[0] === "A" ? "B" : "A") + state.slice(1));
  const cb = await callback(loc, users.A, s.flow);
  assert.equal(cb.status, 303);
  assert.equal(cb.to, `/dashboard/articles/${id}?zenodo=expired`);
  assert.equal(cb.origin, APP);
  assert.deepEqual(s2s(since()), []);
  assert.equal(await row(id), null);
});

test("4. callback: A’ning cookie va state’i B sessiyasi bilan — expired", async () => {
  const id = art.a1.id;
  const s = await start(users.A, id, { rights: true, hash: await hashOf(users.A, id) });
  const cb = await callback(await authorize(s.json.url), users.B, s.flow);
  assert.equal(cb.to, `/dashboard/articles/${id}?zenodo=expired`);
  assert.deepEqual(s2s(since()), []);
  assert.equal(await row(id), null);
});

test("5. callback: oqim cookie’si yo‘q — /dashboard", async () => {
  const id = art.a1.id;
  const s = await start(users.A, id, { rights: true, hash: await hashOf(users.A, id) });
  const cb = await callback(await authorize(s.json.url), users.A, null);
  assert.equal(cb.status, 303);
  assert.equal(cb.to, "/dashboard");
  assert.deepEqual(s2s(since()), []);
});

test("6. callback: o‘qituvchi Zenodo’da rad etdi — denied", async () => {
  const id = art.a1.id;
  mock.config({ deny: true });
  const cb = await deposit(users.A, id);
  assert.equal(cb.to, `/dashboard/articles/${id}?zenodo=denied`);
  assert.deepEqual(s2s(since()), []);
  assert.equal(await row(id), null);
});

test("7. A1: to‘liq joylash (chaqiruvlar, sarlavhalar, yozuv tanasi)", async () => {
  const a = art.a1;
  firstA1 = await deposit(users.A, a.id);
  assert.equal(firstA1.status, 303);
  assert.equal(firstA1.to, `/dashboard/articles/${a.id}`);
  assert.match(firstA1.setCookie, /^am_zenodo=;/);
  assert.match(firstA1.setCookie, /Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  const r = await expectPublished(a.id);
  assert.equal(r.zenodo_user_id, "4242");

  const log = s2s(since());
  assert.deepEqual(calls(log), ["POST /oauth/token", ...fresh(r.record_id, a.key)]);
  for (const e of log) assert.equal(e.ua, UA);
  const [token, create, , put] = log;
  assert.match(token.form.code, /^c-\d+$/);
  assert.deepEqual(token.form, {
    grant_type: "authorization_code",
    code: token.form.code,
    redirect_uri: CALLBACK,
    client_id: MOCK_CLIENT.id,
    client_secret: MOCK_CLIENT.secret,
  });
  assert.equal(token.accept, "application/json");
  assert.equal(token.auth, null); // client ma’lumotlari faqat formada
  for (const e of log.slice(1)) {
    assert.match(e.auth, /^Bearer mock-at-[0-9a-f]+$/);
    assert.equal(e.accept, VND);
  }
  assert.equal(put.contentType, "application/octet-stream");
  assert.equal(put.md5, a.md5);

  const body = create.json;
  const md = body.metadata;
  assert.deepEqual(body.access, { record: "public", files: "public" });
  assert.deepEqual(body.files, { enabled: true });
  assert.deepEqual(md.resource_type, { id: "publication-preprint" });
  assert.equal(md.title, a.titles.uz);
  assert.deepEqual(md.additional_titles, [
    { title: a.titles.ru, type: { id: "translated-title" }, lang: { id: "rus" } },
    { title: a.titles.en, type: { id: "translated-title" }, lang: { id: "eng" } },
  ]);
  assert.ok(md.description.includes("&lt;b&gt;&amp;"), md.description);
  assert.equal(md.description.match(/<p>/g)?.length, 2, md.description);
  assert.ok(md.description.includes("<br>"), md.description);
  assert.deepEqual(
    md.additional_descriptions.map((d) => [d.type.id, d.lang.id]),
    [
      ["abstract", "rus"],
      ["abstract", "eng"],
    ],
  );
  assert.deepEqual(md.languages, [{ id: "uzb" }]);
  assert.deepEqual(
    md.subjects.map((s) => s.subject),
    ["sun’iy intellekt", "Transformer", "matn", "искусственный интеллект", "трансформер", "текст", "artificial intelligence", "text"],
  );
  assert.deepEqual(md.creators, [
    {
      person_or_org: {
        type: "personal",
        given_name: "Dilnoza",
        family_name: "Karimova",
        identifiers: [{ scheme: "orcid", identifier: "0000-0002-1825-0097" }],
      },
      affiliations: [{ name: UNI }],
    },
    { person_or_org: { type: "personal", given_name: "Jasur", family_name: "Toshmatov" }, affiliations: [{ name: UNI }] },
  ]);
  assert.deepEqual(md.rights, [{ id: "cc-by-4.0" }]);
  assert.equal(md.publisher, "Zenodo");
  assert.equal(md.publication_date, "2026-03-05");
  assert.equal(md.related_identifiers, undefined); // APP_URL http — tekshirib bo‘lmaydigan URL yuborilmaydi
  assert.equal(body.pids, undefined);
  assert.equal(body.custom_fields, undefined);
  assert.equal(md.contributors, undefined);

  // after(): o‘qituvchiga xabar urinildi — bo‘sh token bilan Telegram’ga hech narsa ketmadi
  await until(() => serverLog.includes("[notify] o‘qituvchi:"));
  assert.match(serverLog, /\[notify\] o‘qituvchi: Error: TELEGRAM_BOT_TOKEN sozlanmagan/);
});

test("8. DOI kabinetda ko‘rinadi, ommaviy sahifada sinov DOI’si yo‘q", async () => {
  const id = art.a1.id;
  const { doi } = await row(id);
  const dash = await page(users.A, `/dashboard/articles/${id}`);
  assert.equal(dash.status, 200);
  assert.ok(dash.html.includes(doi), "kabinetda DOI yo‘q");
  const pub = await page(null, `/maqola/${id}`);
  assert.equal(pub.status, 200);
  assert.ok(!pub.html.includes("10.5072"));
  assert.ok(!pub.html.includes("citation_doi"));
  // Admin sahifasi ham sinov DOI’sini ko‘rsatmaydi (sahifa ochilgani sarlavhadan bilinadi)
  const admin = await page(users.admin, `/admin/articles/${id}`);
  assert.ok(admin.html.includes(art.a1.titles.uz), "admin sahifasi ochilmadi");
  assert.ok(!admin.html.includes("10.5072"));
});

test("9. qayta start — 409; eski oqimni qayta o‘ynash — busy, token so‘ralmaydi", async () => {
  const id = art.a1.id;
  assert.equal((await start(users.A, id, { rights: true, hash: firstA1.hash })).status, 409);
  const cb = await callback(await authorize(firstA1.url), users.A, firstA1.flow);
  assert.equal(cb.to, `/dashboard/articles/${id}?zenodo=busy`);
  assert.deepEqual(s2s(since()), []);
});

test("10. A2: AI izohi va yopiq litsenziya", async () => {
  const cb = await deposit(users.A, art.a2.id);
  assert.equal(cb.to, `/dashboard/articles/${art.a2.id}`);
  await expectPublished(art.a2.id);
  const md = since().find((e) => e.method === "POST" && e.path === "/api/records").json.metadata;
  assert.deepEqual(md.rights, [{ id: "other-closed" }]);
  const notes = md.additional_descriptions.filter((d) => d.type.id === "notes");
  assert.equal(notes.length, 1);
  assert.equal(notes[0].lang.id, "eng");
  assert.match(notes[0].description, /^<p>AI use: .*Claude.*<\/p>$/);
});

const literal = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
/** Klient komponent prop’i RSC ma’lumotida: "zenodoDoi":"…" (HTML ichida qo‘shtirnoqlar \" bo‘lib keladi) */
const prop = (name, value) => new RegExp(String.raw`${name}\\?":\\?"${literal(value)}\\?"`);

test("11. zenodo.org DOI’si (10.5281) ommaviy sahifada: DOI qatori, citation_doi, sameAs, iqtiboslar; admin", async () => {
  const { id, titles } = art.c11;
  // Avval keshdagi nusxa paydo bo‘ladi (DOI’siz) — joylashdan keyin revalidateTag uni yangilashi kerak
  const before = await page(null, `/maqola/${id}`);
  assert.equal(before.status, 200);
  assert.ok(before.html.includes(titles.uz));
  assert.ok(!before.html.includes("10.5281/") && !before.html.includes("citation_doi"));

  mock.config({ doiPrefix: "10.5281" });
  const cb = await deposit(users.A, id);
  assert.equal(cb.to, `/dashboard/articles/${id}`);
  const r = await row(id);
  assert.equal(r?.status, "published", JSON.stringify(r));
  assert.match(r.doi, /^10\.5281\/zenodo\.\d+$/);
  const doi = literal(r.doi);

  const { status, html } = await page(null, `/maqola/${id}`);
  assert.equal(status, 200);
  // DOI qatori — PublicationLine’ning DOI qismi bilan bir xil
  assert.match(html, new RegExp(`DOI: </span><a href="https://doi\\.org/${doi}"[^>]*>${doi}</a>`));
  assert.match(html, new RegExp(`<meta name="citation_doi" content="${doi}"`));
  assert.ok(html.includes(`"sameAs":"https://doi.org/${r.doi}"`), "JSON-LD sameAs yo‘q");
  // APA DOI havolasi bilan tugaydi, BibTeX’da doi maydoni; sana qatori o‘zgarmaydi
  assert.match(html, new RegExp(`https://doi\\.org/${doi}</p>`));
  assert.ok(html.includes(`doi = {${r.doi}}`), "BibTeX’da doi yo‘q");
  assert.ok(html.includes("Chop etilgan") && !html.includes("Saytga joylangan"));

  // Admin: to‘liq sahifa va navbatdagi panel — DOI qatori va olib tashlash tasdig‘i uchun zenodoDoi
  for (const pathname of [`/admin/articles/${id}`, `/admin/queue?view=${id}`]) {
    const admin = await page(users.admin, pathname);
    assert.ok(admin.html.includes(titles.uz), `${pathname}: sahifa ochilmadi`);
    assert.match(admin.html, new RegExp(`DOI: </span><a href="https://doi\\.org/${doi}"`), `${pathname}: DOI qatori yo‘q`);
    assert.match(admin.html, prop("zenodoDoi", r.doi), `${pathname}: ReviewPanel’da zenodoDoi yo‘q`);
  }
});

test("11b. nashriyot DOI’si bo‘lsa — teglar o‘sha DOI bilan, Zenodo DOI’si chiqmaydi", async () => {
  const { id } = art.a3; // doi = 10.1234/test.1
  // Eski ma’lumot: maqolada nashriyot DOI’si ham, Zenodo yozuvi ham bor (bunday maqolani endi joylab bo‘lmaydi)
  await db.query("insert into zenodo_deposits (article_id, host, status, record_id, doi) values ($1, $2, 'published', '999', '10.5281/zenodo.999')", [
    id,
    HOST,
  ]);
  const { status, html } = await page(null, `/maqola/${id}`);
  assert.equal(status, 200);
  assert.match(html, /<meta name="citation_doi" content="10\.1234\/test\.1"/);
  assert.ok(html.includes('"sameAs":"https://doi.org/10.1234/test.1"'));
  assert.ok(html.includes("doi = {10.1234/test.1}"));
  assert.ok(!html.includes("10.5281/zenodo.999"));
});

test("12. token: invalid_grant — grant; qayta urinish chop etadi", async () => {
  const id = art.c12.id;
  mock.fault({ method: "POST", path: /^\/oauth\/token$/, status: 400, body: { error: "invalid_grant" } });
  const cb = await deposit(users.A, id);
  assert.equal(cb.to, `/dashboard/articles/${id}`);
  await expectFailed(id, "grant");
  assert.deepEqual(calls(s2s(since())), ["POST /oauth/token"]);
  mark = mock.log().length;
  await deposit(users.A, id);
  const r = await expectPublished(id);
  assert.deepEqual(calls(s2s(since())), ["POST /oauth/token", ...fresh(r.record_id, art.c12.key)]);
  assertOnePublishedPerArticle();
});

test("13. publish 500 — unavailable; qayta urinishda qoralama o‘chiriladi va yangisi chop etiladi", async () => {
  const { id, key } = art.c13;
  mock.fault({ method: "POST", path: /\/actions\/publish$/, status: 500, body: { status: 500, message: "Internal error" } });
  await deposit(users.A, id);
  const failed = await expectFailed(id, "unavailable");
  const old = failed.record_id;
  assert.ok(old, "record_id saqlanishi kerak");
  mark = mock.log().length;
  await deposit(users.A, id);
  const r = await expectPublished(id);
  assert.notEqual(r.record_id, old);
  const log = s2s(since());
  assert.deepEqual(calls(log), ["POST /oauth/token", `GET /api/records/${old}`, `DELETE /api/records/${old}/draft`, ...fresh(r.record_id, key)]);
  assert.deepEqual([log[1].status, log[2].status], [404, 204]);
  assert.equal(mock.records().find((x) => x.id === old).state, "discarded");
  assertOnePublishedPerArticle();
});

test("14. publish bajarildi, javob 504 — qayta urinish o‘sha yozuvni oladi", async () => {
  const { id } = art.c14;
  mock.fault({ method: "POST", path: /\/actions\/publish$/, apply: true, status: 504, body: "<html>504 Gateway Time-out</html>", contentType: "text/html" });
  await deposit(users.A, id);
  const failed = await expectFailed(id, "unavailable");
  const record = mock.records().find((x) => x.id === failed.record_id);
  assert.equal(record.state, "published");
  mark = mock.log().length;
  await deposit(users.A, id);
  const r = await expectPublished(id);
  assert.equal(r.record_id, record.id);
  assert.equal(r.doi, record.doi);
  assert.deepEqual(calls(s2s(since())), ["POST /oauth/token", `GET /api/records/${record.id}`]);
  assertOnePublishedPerArticle();
});

test("15. create 201 + errors[] — rejected, fayl yuklanmaydi; qayta urinish chop etadi", async () => {
  const { id, key } = art.c15;
  mock.fault({ method: "POST", path: /^\/api\/records$/, apply: true, patch: { errors: [{ field: "metadata.title", messages: ["mock"] }] } });
  await deposit(users.A, id);
  const failed = await expectFailed(id, "rejected");
  assert.match(failed.error_detail, /metadata\.title: mock/);
  assert.ok(failed.record_id);
  assert.deepEqual(calls(s2s(since())), ["POST /oauth/token", "POST /api/records"]);
  // rejected — adminlarga xabar (bo‘sh token: faqat log)
  await until(() => serverLog.includes("[notify] admin:"));
  assert.match(serverLog, /\[notify\] admin: Error: TELEGRAM_BOT_TOKEN sozlanmagan/);
  mark = mock.log().length;
  await deposit(users.A, id);
  const r = await expectPublished(id);
  const old = failed.record_id;
  assert.deepEqual(calls(s2s(since())), ["POST /oauth/token", `GET /api/records/${old}`, `DELETE /api/records/${old}/draft`, ...fresh(r.record_id, key)]);
  assertOnePublishedPerArticle();
});

test("16. commit md5 mos emas — file, chop etilmaydi", async () => {
  const { id } = art.c16;
  mock.fault({ method: "POST", path: /\/commit$/, apply: true, patch: { checksum: "md5:00000000000000000000000000000000" } });
  await deposit(users.A, id);
  await expectFailed(id, "file");
  assert.ok(!calls(since()).some((c) => c.endsWith("/actions/publish")));
  assertOnePublishedPerArticle();
});

test("17. create: HTML 403 — config; 429 — rate_limited", async () => {
  const { id } = art.c17;
  mock.fault({ method: "POST", path: /^\/api\/records$/, status: 403, body: "<html>403 Forbidden</html>", contentType: "text/html" });
  await deposit(users.A, id);
  await expectFailed(id, "config");
  mock.fault({ method: "POST", path: /^\/api\/records$/, status: 429, body: { status: 429, message: "Too many requests" } });
  await deposit(users.A, id);
  await expectFailed(id, "rate_limited");
  assert.ok(!calls(since()).some((c) => c.includes("/draft/")));
  assertOnePublishedPerArticle();
});

test("18. publish: akkaunt bloklangan — blocked", async () => {
  const { id } = art.c18;
  mock.fault({
    method: "POST",
    path: /\/actions\/publish$/,
    status: 400,
    body: { status: 400, message: "Your account has been blocked - suspected spam." },
  });
  await deposit(users.A, id);
  const r = await expectFailed(id, "blocked");
  assert.match(r.error_detail, /blocked/);
  assertOnePublishedPerArticle();
});

test("19. token: HTML 404 (noto‘g‘ri client yoki server) — config", async () => {
  const { id } = art.c19;
  mock.fault({ method: "POST", path: /^\/oauth\/token$/, status: 404, body: "<html>404 Not Found</html>", contentType: "text/html" });
  await deposit(users.A, id);
  await expectFailed(id, "config");
  assert.deepEqual(calls(s2s(since())), ["POST /oauth/token"]);
});

test("19b. token javobida user yo‘q — id /api/me’dan olinadi", async () => {
  const { id, key } = art.c19b;
  mock.config({ tokenUser: false });
  await deposit(users.A, id);
  const r = await expectPublished(id);
  assert.equal(r.zenodo_user_id, "4242");
  const log = s2s(since());
  assert.deepEqual(calls(log), ["POST /oauth/token", "GET /api/me", ...fresh(r.record_id, key)]);
  assert.equal(log[1].accept, "application/json");
  assert.match(log[1].auth, /^Bearer mock-at-/);
  assert.equal(log[1].ua, UA);
});

test("20. bitta Zenodo akkaunti — bitta o‘qituvchi", async () => {
  const { id } = art.b1;
  // 4242 akkaunti A1’ni A uchun chop etgan: B uchun ishlatilmaydi, Zenodo’ga yozuv yuborilmaydi
  await deposit(users.B, id);
  await expectFailed(id, "account_taken");
  assert.deepEqual(calls(s2s(since())), ["POST /oauth/token"]);
  mock.config({ userId: "5151" });
  await deposit(users.B, id);
  const r = await expectPublished(id);
  assert.equal(r.zenodo_user_id, "5151");
  assertOnePublishedPerArticle();
});

test("21. parallel callback’lar: bitta token, bitta yozuv, ikkinchisi busy", async () => {
  const { id, key } = art.c21;
  const s = await start(users.A, id, { rights: true, hash: await hashOf(users.A, id) });
  const [l1, l2] = [await authorize(s.json.url), await authorize(s.json.url)];
  const results = await Promise.all([callback(l1, users.A, s.flow), callback(l2, users.A, s.flow)]);
  assert.deepEqual(results.map((x) => x.to).sort(), [`/dashboard/articles/${id}`, `/dashboard/articles/${id}?zenodo=busy`]);
  assert.equal(calls(since()).filter((c) => c === "POST /oauth/token").length, 1);
  await expectPublished(id);
  assert.equal(mock.records().filter((x) => x.state === "published" && x.keys.includes(key)).length, 1);
  assertOnePublishedPerArticle();
});

test("22. 10 daqiqadan eski in_progress — qayta urinish mumkin; yangisi — 409", async () => {
  await db.query("insert into zenodo_deposits (article_id, host, status, updated_at) values ($1, $2, 'in_progress', now() - interval '11 minutes')", [
    art.c22.id,
    HOST,
  ]);
  await deposit(users.A, art.c22.id);
  await expectPublished(art.c22.id);
  // Xesh yangi qator qo‘shilishidan oldin olinadi: 409 aynan band qator sababli bo‘lsin
  const hash = await hashOf(users.A, art.c22b.id);
  await db.query("insert into zenodo_deposits (article_id, host, status, updated_at) values ($1, $2, 'in_progress', now() - interval '1 minute')", [
    art.c22b.id,
    HOST,
  ]);
  const r = await start(users.A, art.c22b.id, { rights: true, hash });
  assert.equal(r.status, 409);
  assertOnePublishedPerArticle();
});

test("23. joylash paytida maqola olib tashlandi — article_changed, chop etilmaydi", async () => {
  const { id } = art.c23;
  mock.fault({ method: "POST", path: /\/commit$/, apply: true, delayMs: 1500 });
  const s = await start(users.A, id, { rights: true, hash: await hashOf(users.A, id) });
  const pending = callback(await authorize(s.json.url), users.A, s.flow);
  await until(() => since().some((e) => e.path.endsWith("/commit")));
  await db.query("update articles set status = 'rejected', review_note = 'test' where id = $1", [id]);
  const cb = await pending;
  assert.equal(cb.to, `/dashboard/articles/${id}`);
  await expectFailed(id, "article_changed");
  assert.ok(!calls(since()).some((c) => c.endsWith("/actions/publish")));
  assertOnePublishedPerArticle();
});

test("24. token va client secret hech qayerga sizib chiqmaydi", async () => {
  await page(users.A, `/dashboard/articles/${art.a1.id}`);
  await page(null, `/maqola/${art.a1.id}`);
  for (const text of [serverLog, ...seen]) {
    for (const secret of SECRETS) assert.ok(!text.includes(secret), `sizib chiqdi: ${secret}`);
  }
});

test("25. Zenodo’ga ketgan har bir server so‘rovida Avtomaqola User-Agent’i", () => {
  const log = s2s(mock.log());
  assert.ok(log.length > 20);
  assert.deepEqual(
    log.filter((e) => e.ua !== UA).map((e) => `${e.method} ${e.path} ${e.ua}`),
    [],
  );
});
