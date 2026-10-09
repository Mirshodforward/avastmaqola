// Zenodo’ning sinov nusxasi (faqat testlar uchun): OAuth va InvenioRDM /api/records, hammasi xotirada.
//   node tests/zenodo/mock.mjs  — qo‘lda sinash uchun 4010-portda ishga tushadi
// zenodo.org kabi: server so‘rovi User-Agent’siz yoki "node…" UA bilan kelsa — HTML 403 (sandbox buni qilmaydi).
import { createHash, randomBytes } from "node:crypto";
import http from "node:http";
import { pathToFileURL } from "node:url";

export const MOCK_CLIENT = { id: "mock-client", secret: "mock-secret" };
const VND = "application/vnd.inveniordm.v1+json";
const SCOPES = ["deposit:write", "deposit:actions"];
// tokenUser: false — token javobida `user` yo‘q (ilova /api/me’dan oladi)
const DEFAULTS = { userId: "4242", doiPrefix: "10.5072", deny: false, tokenUser: true };
const HTML_403 = "<html><head><title>403 Forbidden</title></head><body><h1>403 Forbidden</h1></body></html>";

const md5 = (data) => createHash("md5").update(data).digest("hex");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const json = (status, body) => ({ status, body });
const invalid = (field, message) =>
  json(400, { status: 400, message: "A validation error occurred.", errors: [{ field, messages: [message] }] });

export async function startMock({ port = 4010, redirectUris = [] } = {}) {
  const url = `http://127.0.0.1:${port}`;
  let cfg = { ...DEFAULTS };
  let faults = [];
  const entries = [];
  const codes = new Map(); // code → { redirectUri, userId, used }
  const tokens = new Map(); // access token → Zenodo user id
  const records = new Map(); // id → { id, owner, state: draft | published | discarded, body, files, doi }
  let lastCode = 0;
  let lastRecord = 1000;

  function authorize(q) {
    const redirectUri = q.get("redirect_uri") ?? "";
    const scopes = (q.get("scope") ?? "").split(" ");
    if (
      q.get("response_type") !== "code" ||
      q.get("client_id") !== MOCK_CLIENT.id ||
      !redirectUris.includes(redirectUri) ||
      !SCOPES.every((s) => scopes.includes(s))
    ) {
      return { status: 400, body: "<html><body>Invalid authorization request</body></html>" };
    }
    const to = new URL(redirectUri);
    if (cfg.deny) to.searchParams.set("error", "access_denied");
    else {
      const code = `c-${++lastCode}`;
      codes.set(code, { redirectUri, userId: cfg.userId, used: false });
      to.searchParams.set("code", code);
    }
    to.searchParams.set("state", q.get("state") ?? "");
    return { status: 302, headers: { location: to.href } };
  }

  function token(form) {
    if (form.client_id !== MOCK_CLIENT.id) return { status: 404, body: "<html><body>404 Not Found</body></html>" };
    if (form.client_secret !== MOCK_CLIENT.secret) return json(401, { error: "invalid_client" });
    if (form.grant_type !== "authorization_code") return json(400, { error: "unsupported_grant_type" });
    const grant = codes.get(form.code);
    if (!grant || grant.used) return json(400, { error: "invalid_grant" });
    grant.used = true;
    if (form.redirect_uri !== grant.redirectUri) return json(400, { error: "invalid_request" });
    // Yangi token shu foydalanuvchining oldingi tokenini o‘chiradi (Zenodo: bitta ilova — bitta token)
    for (const [t, owner] of tokens) if (owner === grant.userId) tokens.delete(t);
    const access = `mock-at-${randomBytes(12).toString("hex")}`;
    tokens.set(access, grant.userId);
    return json(200, {
      access_token: access,
      token_type: "Bearer",
      expires_in: 5184000,
      refresh_token: `mock-rt-${randomBytes(12).toString("hex")}`,
      scope: SCOPES.join(" "),
      ...(cfg.tokenUser ? { user: { id: grant.userId } } : {}),
    });
  }

  const userOf = (auth) => (auth?.startsWith("Bearer ") ? (tokens.get(auth.slice(7)) ?? null) : null);

  const recordJson = (r) => ({
    id: r.id,
    is_draft: r.state === "draft",
    is_published: r.state === "published",
    status: r.state,
    ...(r.doi ? { pids: { doi: { identifier: r.doi, provider: "datacite", client: "datacite" } } } : {}),
    metadata: r.body.metadata,
    links: { self: `${url}/api/records/${r.id}`, self_html: `${url}/records/${r.id}` },
  });

  /** Egasining qoralamasi yoki xato javobi */
  function draftOf(user, id) {
    const r = records.get(id);
    if (!r || r.state !== "draft") return { error: json(404, { status: 404, message: "Draft not found." }) };
    if (r.owner !== user) return { error: json(403, { status: 403, message: "Permission denied." }) };
    return { r };
  }

  function recordsApi(method, path, entry, raw) {
    if (!entry.accept?.includes(VND)) return json(406, { status: 406, message: "Invalid 'Accept' header." });
    const user = userOf(entry.auth);
    if (!user) return json(403, { status: 403, message: "Permission denied." });
    if (method === "POST" && path === "/api/records") {
      const body = entry.json ?? {};
      const md = body.metadata ?? {};
      if (body.access?.record !== "public") return invalid("access.record", "Must be public.");
      if (body.files?.enabled !== true) return invalid("files.enabled", "Must be enabled.");
      if (typeof md.title !== "string" || md.title.trim().length < 3) return invalid("metadata.title", "Shorter than minimum length 3.");
      if (!Array.isArray(md.creators) || md.creators.length === 0) return invalid("metadata.creators", "Missing data for required field.");
      if (!md.resource_type?.id) return invalid("metadata.resource_type", "Missing data for required field.");
      if (!md.publication_date) return invalid("metadata.publication_date", "Missing data for required field.");
      const id = String(++lastRecord);
      records.set(id, { id, owner: user, state: "draft", body, files: new Map(), doi: null });
      return json(201, { id, is_draft: true, is_published: false, status: "draft", links: { self: `${url}/api/records/${id}/draft` } });
    }
    const m = path.match(/^\/api\/records\/([^/]+)(\/draft(?:\/files(?:\/([^/]+)\/(content|commit))?|\/actions\/publish)?)?$/);
    if (!m) return json(404, { status: 404, message: "Not found." });
    const [, id, tail = "", rawKey, action] = m;

    if (method === "GET" && tail === "") {
      const r = records.get(id);
      if (!r || r.state === "discarded") return json(404, { status: 404, message: "The persistent identifier does not exist." });
      if (r.state !== "published") return json(404, { status: 404, message: "The persistent identifier is not registered." });
      return json(200, recordJson(r));
    }
    if (method === "DELETE" && tail === "/draft") {
      const { r, error } = draftOf(user, id);
      if (error) return error;
      r.state = "discarded";
      return { status: 204 };
    }

    const { r, error } = draftOf(user, id);
    if (error) return error;
    if (method === "POST" && tail === "/draft/files") {
      const keys = Array.isArray(entry.json) ? entry.json.map((f) => f?.key) : [];
      if (!keys.length || keys.some((k) => typeof k !== "string" || !k)) return invalid("entries", "Invalid file keys.");
      if (keys.some((k) => r.files.has(k))) return json(400, { status: 400, message: "File with this key already exists." });
      for (const key of keys) r.files.set(key, { status: "pending", bytes: null });
      return json(201, { entries: keys.map((key) => ({ key, status: "pending" })) });
    }
    const key = rawKey ? decodeURIComponent(rawKey) : null;
    const file = key ? r.files.get(key) : null;
    if (method === "PUT" && action === "content") {
      if (!file) return json(404, { status: 404, message: "File not found." });
      file.bytes = raw;
      return json(200, { key, status: "pending" });
    }
    if (method === "POST" && action === "commit") {
      if (!file?.bytes) return json(400, { status: 400, message: "File content is missing." });
      file.status = "completed";
      return json(200, { key, status: "completed", checksum: `md5:${md5(file.bytes)}`, size: file.bytes.length });
    }
    if (method === "POST" && tail === "/draft/actions/publish") {
      if (![...r.files.values()].some((f) => f.status === "completed")) return invalid("files.enabled", "Missing uploaded files.");
      r.state = "published";
      r.doi = `${cfg.doiPrefix}/zenodo.${r.id}`;
      return json(202, recordJson(r));
    }
    return json(405, { status: 405, message: "Method not allowed." });
  }

  function handle(method, target, entry, raw) {
    const path = target.pathname;
    // Brauzer navigatsiyasi: UA qoidasi faqat server so‘rovlariga
    if (method === "GET" && path === "/oauth/authorize") return authorize(target.searchParams);
    if (!entry.ua || /^node/i.test(entry.ua)) return { status: 403, body: HTML_403 };
    if (method === "POST" && path === "/oauth/token") return token(entry.form ?? {});
    if (method === "GET" && path === "/api/me") {
      const user = userOf(entry.auth);
      return user ? json(200, { id: user }) : json(401, { status: 401, message: "The server could not verify that you are authorized." });
    }
    if (path.startsWith("/api/records")) return recordsApi(method, path, entry, raw);
    return { status: 404, body: "<html><body>404 Not Found</body></html>" };
  }

  function takeFault(method, path) {
    const f = faults.find((x) => x.times > 0 && (!x.method || x.method === method) && x.path.test(path));
    if (f) f.times -= 1;
    return f;
  }

  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    const target = new URL(req.url, url);
    const type = req.headers["content-type"] ?? null;
    const entry = {
      method: req.method,
      path: target.pathname,
      ua: req.headers["user-agent"] ?? null,
      accept: req.headers.accept ?? null,
      auth: req.headers.authorization ?? null,
      contentType: type,
    };
    if (type?.startsWith("application/json")) {
      try {
        entry.json = JSON.parse(raw.toString("utf8"));
      } catch {
        entry.json = null;
      }
    } else if (type?.startsWith("application/x-www-form-urlencoded")) {
      entry.form = Object.fromEntries(new URLSearchParams(raw.toString("utf8")));
    } else if (raw.length) {
      entry.md5 = md5(raw);
      entry.size = raw.length;
    }
    // Javobdan oldin yoziladi: test kechiktirilgan so‘rov kelganini kutib tura oladi
    entries.push(entry);

    const fault = takeFault(req.method, target.pathname);
    if (fault?.delayMs) await sleep(fault.delayMs);
    let reply;
    if (fault && !fault.apply) {
      reply = { status: fault.status ?? 500, body: fault.body, contentType: fault.contentType };
    } else {
      reply = handle(req.method, target, entry, raw);
      if (fault) {
        reply = {
          ...reply,
          status: fault.status ?? reply.status,
          body: fault.body ?? (fault.patch ? { ...reply.body, ...fault.patch } : reply.body),
          contentType: fault.contentType ?? reply.contentType,
        };
      }
    }
    entry.status = reply.status;
    entry.fault = Boolean(fault);

    const text = reply.body === undefined ? "" : typeof reply.body === "string" ? reply.body : JSON.stringify(reply.body);
    const contentType = reply.contentType ?? (typeof reply.body === "string" ? "text/html; charset=utf-8" : "application/json");
    res.writeHead(reply.status, { ...(text ? { "content-type": contentType } : {}), ...reply.headers });
    res.end(text);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  return {
    url,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
    /** Barcha so‘rovlar (reset ham o‘chirmaydi): {method, path, ua, accept, auth, contentType, json?, form?, md5?, status} */
    log: () => entries.slice(),
    records: () =>
      [...records.values()].map((r) => ({ id: r.id, owner: r.owner, state: r.state, doi: r.doi, keys: [...r.files.keys()] })),
    /** {method, path: RegExp, times = 1, delayMs = 0, apply = false, status?, body?, patch?, contentType?} */
    fault: (f) => faults.push({ times: 1, delayMs: 0, apply: false, ...f }),
    config: (c) => Object.assign(cfg, c),
    reset: () => {
      faults = [];
      cfg = { ...DEFAULTS };
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mock = await startMock({
    port: Number(process.env.MOCK_PORT ?? 4010),
    redirectUris: ["http://localhost:3000/api/zenodo/callback", "http://localhost:3100/api/zenodo/callback"],
  });
  console.log(`Zenodo mock: ${mock.url} (client_id ${MOCK_CLIENT.id})`);
}
