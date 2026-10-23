// hugo.toml 的定点读写 + 主题社交图标清单解析
//
// 设计原则：不整体解析再序列化 TOML——那会丢掉 hugo.toml 里的注释、空行和顺序。
// 这里只按「段名 + 键」定位到具体行做替换，找不到才追加，其余内容原样保留。

import path from "node:path";
import { promises as fsp } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");
export const TOML_PATH = path.join(ROOT, "hugo.toml");
export const SOCIAL_YML = path.join(ROOT, "assets", "data", "social.yml");

// ---------- TOML 扫描 ----------

const SECTION_RE = /^(\s*)\[(\[)?([^\[\]]+)\](\])?\s*(?:#.*)?$/;

function scan(text) {
  const lines = text.split("\n");
  const sections = [{ name: "", array: false, headerIdx: -1, start: 0, end: lines.length, indent: "" }];
  let cur = sections[0];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart()[0] !== "[") continue; // 绝大多数行快速跳过
    const m = line.match(SECTION_RE);
    if (!m) continue;
    cur.end = i;
    const decl = {
      name: m[3].trim(),
      array: Boolean(m[2]),
      headerIdx: i,
      start: i + 1,
      end: lines.length,
      indent: null,
    };
    sections.push(decl);
    cur = decl;
  }

  // 每个段内部键的统一缩进：取第一行 key = value 的缩进
  for (const sec of sections) {
    for (let i = sec.start; i < sec.end; i++) {
      const line = lines[i];
      if (!line.trim() || /^\s*#/.test(line)) continue;
      const m = line.match(/^(\s*)[A-Za-z0-9_."'-]+\s*=/);
      if (m) {
        sec.indent = m[1];
        break;
      }
    }
    if (sec.indent === null) sec.indent = "  ";
  }

  return { lines, sections };
}

function findSection(sections, name) {
  const target = String(name).toLowerCase();
  return sections.find((s) => s.name.toLowerCase() === target) || null;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// TOML basic string：JSON 的转义规则在这里是安全的子集
export function tomlString(value) {
  return JSON.stringify(String(value == null ? "" : value));
}

function unquote(raw) {
  let v = String(raw).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

function stripComment(raw) {
  // 只在字符串之外遇到 # 才当注释
  let inDq = false;
  let inSq = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"' && !inSq && raw[i - 1] !== "\\") inDq = !inDq;
    else if (c === "'" && !inDq) inSq = !inSq;
    else if (c === "#" && !inDq && !inSq) return raw.slice(0, i);
  }
  return raw;
}

// TOML 内联表 { url = "…" } —— 主题用它来直接指定完整地址，绕过 Prefix 拼接
function parseInlineTable(raw) {
  const m = String(raw).trim().match(/^\{([\s\S]*)\}$/);
  if (!m) return null;
  const out = {};
  const re = /([A-Za-z0-9_-]+)\s*=\s*("(?:[^"\\]|\\.)*"|'[^']*'|[^,]+)/g;
  let x;
  while ((x = re.exec(m[1])) !== null) out[x[1].toLowerCase()] = unquote(x[2].trim());
  return out;
}

// 读取某段下的所有键值（同段重复出现时以第一次为准，[[menu.main]] 这种数组表只取第一块）
export function readSection(text, sectionName) {
  const { lines, sections } = scan(text);
  const sec = findSection(sections, sectionName);
  const out = {};
  if (!sec) return out;
  for (let i = sec.start; i < sec.end; i++) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const m = line.match(/^(\s*)([A-Za-z0-9_."'-]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[2].replace(/^["']|["']$/g, "");
    const lower = key.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(out, lower)) continue;
    const raw = stripComment(m[3]).trim();
    const table = parseInlineTable(raw);
    out[lower] = {
      key,
      raw,
      table,
      value: table ? table.url || table.id || "" : unquote(raw),
    };
  }
  return out;
}

export function getValue(text, sectionName, key) {
  const sec = readSection(text, sectionName);
  const hit = sec[String(key).toLowerCase()];
  return hit ? hit.value : undefined;
}

// 在指定段里设置 key：命中就改值（保留原缩进与键名大小写），否则追加到段末
// 输入走 TOML 字符串编码；需要写内联表等原始表达式时用 setRaw
export function setValue(text, sectionName, key, value) {
  return setRaw(text, sectionName, key, tomlString(value));
}

// expr 必须是已经编码好的 TOML 值表达式，例如 `"abc"` 或 `{ url = "https://…" }`
export function setRaw(text, sectionName, key, expr) {
  const { lines, sections } = scan(text);
  const sec = findSection(sections, sectionName);

  if (!sec) {
    // 段不存在：追加到文件末尾（仅支持一级 params.xxx 形式，够本项目用）
    const block = [`[${sectionName}]`, `  ${key} = ${expr}`, ""];
    const base = text.endsWith("\n") ? text : text + "\n";
    return base + "\n" + block.join("\n");
  }

  const re = new RegExp("^(\\s*)" + escapeRe(key) + "\\s*=", "i");
  for (let i = sec.start; i < sec.end; i++) {
    if (re.test(lines[i])) {
      const indent = lines[i].match(re)[1];
      lines[i] = `${indent}${key} = ${expr}`;
      return lines.join("\n");
    }
  }

  let insertAt = sec.start;
  for (let i = sec.start; i < sec.end; i++) {
    if (lines[i].trim() && !/^\s*#/.test(lines[i])) insertAt = i + 1;
  }
  lines.splice(insertAt, 0, `${sec.indent}${key} = ${expr}`);
  return lines.join("\n");
}

export function applyEdits(text, edits) {
  let out = text;
  for (const [section, key, value] of edits) out = setValue(out, section, key, value);
  return out;
}

// ---------- 站点设置读写 ----------

export const AVATAR_DIR = path.join(ROOT, "static", "images");

export async function readToml() {
  return fsp.readFile(TOML_PATH, "utf-8");
}

export async function writeToml(text) {
  // 写前做个最小校验，避免把 hugo.toml 写坏
  const { sections } = scan(text);
  const hasParams = sections.some((s) => s.name.toLowerCase() === "params");
  if (!hasParams) throw new Error("hugo.toml 结构异常（缺少 [params]），已放弃写入");
  await fsp.writeFile(TOML_PATH, text, "utf-8");
}

// 主题支持的社交平台清单（读 assets/data/social.yml）
//
// 主题里同一个平台可能登记了多种 URL 形态（YouTube 就占了三项：user/、c/、channel/），
// 直接丢给下拉框会出现三个「YouTube」。这里按显示名合并成一项，其余记为 aliases：
//   - 下拉只看到一项；
//   - 已有配置里写成别名键（Youtubelegacy 等）的仍能读出来、写回去。
const LABEL_LOWER_KEEP = new Set(["bilibili", "deviantart", "flickr", "slideshare", "soundcloud"]);

function prettyLabel(raw, key) {
  const s = String(raw || key || "").trim();
  if (!s) return key;
  if (/^[a-z0-9.+ ]+$/.test(s) && !LABEL_LOWER_KEEP.has(s) && s.length > 1) {
    return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }
  return s;
}

let catalogCache = null;

export async function readSocialCatalog() {
  if (catalogCache) return catalogCache;
  const raw = await fsp.readFile(SOCIAL_YML, "utf-8");
  const all = [];
  let cur = null;
  for (const line of raw.split("\n")) {
    const l = line.replace(/\s+$/, "");
    if (!l || /^\s*#/.test(l)) continue;
    let m = l.match(/^([A-Za-z0-9_]+):\s*$/);
    if (m) {
      cur = { key: m[1], weight: 999, prefix: "", template: "", url: "", label: m[1], icon: "" };
      all.push(cur);
      continue;
    }
    if (!cur) continue;
    m = l.match(/^\s{2}(Weight|Prefix|Template|Url|Title|Newtab|Icon):\s*(.*)$/);
    if (m) {
      const k = m[1].toLowerCase();
      const v = m[2].trim();
      if (k === "weight") cur.weight = Number(v) || 999;
      else if (k === "title") cur.label = v;
      else if (k === "prefix") cur.prefix = v;
      else if (k === "template") cur.template = v;
      else if (k === "url") cur.url = v;
      continue;
    }
    m = l.match(/^\s{4}Class:\s*(.*)$/);
    if (m) cur.icon = m[1].trim();
  }

  all.sort((a, b) => a.weight - b.weight || a.key.localeCompare(b.key));

  // 按显示名分组去重，保留权重最小的一项作为主键
  const groups = new Map();
  for (const c of all) {
    const gk = c.label.trim().toLowerCase();
    if (!groups.has(gk)) groups.set(gk, []);
    groups.get(gk).push(c);
  }

  const merged = [];
  const aliasOf = new Map(); // 别名小写 → 主键小写
  const labelOf = new Map(); // 显示名小写 → 主键小写（前端按显示名提交时也能认）
  for (const [, arr] of groups) {
    const primary = arr[0];
    const aliases = arr.slice(1).map((a) => a.key);
    for (const a of aliases) aliasOf.set(a.toLowerCase(), primary.key.toLowerCase());
    labelOf.set(primary.label.trim().toLowerCase(), primary.key.toLowerCase());
    merged.push({
      ...primary,
      label: prettyLabel(primary.label, primary.key),
      aliases,
    });
  }

  catalogCache = {
    all,
    merged,
    byKey: new Map(all.map((c) => [c.key.toLowerCase(), c])),
    byMerged: new Map(merged.map((c) => [c.key.toLowerCase(), c])),
    aliasOf,
    labelOf,
  };
  return catalogCache;
}

// 把任意写法（含别名）归一到主键，写回 hugo.toml 时用
function resolveKey(rawKey) {
  if (!catalogCache) return null;
  const k = String(rawKey || "").trim().toLowerCase();
  if (!k) return null;
  const primary =
    catalogCache.aliasOf.get(k) ||
    (catalogCache.byKey.has(k) ? k : null) ||
    catalogCache.labelOf.get(k) ||
    null;
  if (!primary) return null;
  const hit = catalogCache.byKey.get(primary);
  return hit ? hit.key : null;
}

// 名字转成 hugo.toml 里惯用的键名：github → Github（查找大小写不敏感）
function canonicalKey(rawKey) {
  const key = resolveKey(rawKey);
  if (!key) return "";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function tomlSocialKeyLabel(key) {
  const k = String(key || "").trim();
  return k.charAt(0).toUpperCase() + k.slice(1);
}

export function normalizeSocialKey(rawKey) {
  return canonicalKey(rawKey);
}

// 当前配置的社交平台（保持 hugo.toml 里的原始键名与顺序）
export function listSocial(text, catalog) {
  const sec = readSection(text, "params.social");
  const entries = [];
  for (const item of Object.values(sec)) {
    if (!item.value) continue;
    const primary = catalog.merged.find((c) => c.key.toLowerCase() === item.key.toLowerCase())
      || catalog.merged.find((c) => (c.aliases || []).some((a) => a.toLowerCase() === item.key.toLowerCase()))
      || catalog.merged.find((c) => c.label.toLowerCase() === item.key.toLowerCase());
    const entry = { key: item.key, label: primary ? primary.label : item.key, value: item.value };
    if (item.raw.trim().startsWith("{")) {
      entry.form = "url";
      entry.table = item.table;
    }
    entries.push(entry);
  }
  return entries;
}

export function socialUrl(entry, catalog) {
  if (entry && entry.table && entry.table.url) return entry.table.url;
  const c = catalog.merged.find(
    (x) =>
      x.key.toLowerCase() === String(entry.key).toLowerCase() ||
      (x.aliases || []).some((a) => a.toLowerCase() === String(entry.key).toLowerCase())
  );
  const v = String(entry.value || "");
  if (!c) return v;
  if (/^https?:\/\//i.test(v) || /^mailto:/i.test(v) || v.startsWith("/")) return v;
  if (c.template) return c.template.replace("%v", v);
  if (c.prefix) return c.prefix.replace(/\/+$/, "") + "/" + v.replace(/^\/+/, "");
  return v;
}

// 值可能是「账号」，也可能是用户直接粘的完整地址。
// 主题会把账号用 Prefix/Template 拼成链接，所以完整地址必须写成 { url = "…" } 内联表，
// 否则 https://github.com/foo 会被拼成 https://github.com/https://github.com/foo。
function socialValueExpr(entry, value) {
  const v = String(value || "").trim();
  if (!v) return tomlString("");
  const looksAbsolute = /^(https?:\/\/|mailto:|tel:|skype:|xmpp:|\/)/i.test(v);
  if (!looksAbsolute) return tomlString(v);

  // 完整地址里正好是平台自己的前缀时，还原成账号，hugo.toml 更整洁、主题行为不变
  const prefix = String(entry.prefix || "").replace(/\/+$/, "");
  if (prefix && v.toLowerCase().startsWith(prefix.toLowerCase() + "/")) {
    return tomlString(v.slice(prefix.length + 1));
  }
  const scheme = String(entry.template || "").match(/^([a-z]+:(?:\/\/)?)/i);
  if (scheme && v.toLowerCase().startsWith(scheme[1].toLowerCase())) {
    return tomlString(v.slice(scheme[1].length));
  }
  return `{ url = ${tomlString(v)} }`;
}

// ---------- 访问统计 ----------

export const ANALYTICS_PROVIDERS = ["none", "goatcounter", "umami", "ga4", "cloudflare", "busuanzi"];

/* GoatCounter 的 site 只该是子域名本身（tianchao）。模板里会拼成
   https://<site>.goatcounter.com，所以用户把整条 URL 粘进来必须剥掉协议、
   路径和 .goatcounter.com 后缀，否则会拼出 https://https://x.goatcounter.com.goatcounter.com。 */
export function normalizeGoatSite(raw) {
  let s = String(raw == null ? "" : raw).trim();
  if (!s) return "";
  s = s.replace(/^https?:\/\//i, "").replace(/^\/\//, "");
  s = s.split(/[/?#\s]/)[0];
  s = s.replace(/\.goatcounter\.com\.?$/i, "");
  return s.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function readAnalytics(text) {
  const countersRaw = getValue(text, "params.analytics.goatcounter", "counters");
  return {
    provider: (getValue(text, "params.analytics", "provider") || "none").toLowerCase(),
    goatcounterSite: normalizeGoatSite(getValue(text, "params.analytics.goatcounter", "site")),
    goatcounterCounters: countersRaw === undefined ? true : String(countersRaw).toLowerCase() !== "false",
    umamiScript: getValue(text, "params.analytics.umami", "script") || "https://cloud.umami.is/script.js",
    umamiWebsiteId: getValue(text, "params.analytics.umami", "websiteId") || "",
    ga4MeasurementId: getValue(text, "params.analytics.ga4", "measurementId") || "",
    cloudflareToken: getValue(text, "params.analytics.cloudflare", "token") || "",
  };
}

function saveAnalytics(text, input) {
  const a = input || {};
  const provider = ANALYTICS_PROVIDERS.includes(String(a.provider || "").toLowerCase())
    ? String(a.provider).toLowerCase()
    : "none";

  // 先写 provider，保证 [params.analytics] 段存在，后续子表才有地方插
  let out = setValue(text, "params.analytics", "provider", provider);
  out = setValue(out, "params.analytics.goatcounter", "site", normalizeGoatSite(a.goatcounterSite));
  out = setRaw(out, "params.analytics.goatcounter", "counters", a.goatcounterCounters === false ? "false" : "true");
  out = setValue(out, "params.analytics.umami", "script", String(a.umamiScript || "").trim() || "https://cloud.umami.is/script.js");
  out = setValue(out, "params.analytics.umami", "websiteId", String(a.umamiWebsiteId || "").trim());
  out = setValue(out, "params.analytics.ga4", "measurementId", String(a.ga4MeasurementId || "").trim());
  out = setValue(out, "params.analytics.cloudflare", "token", String(a.cloudflareToken || "").trim());
  return out;
}

export async function readSiteSettings() {
  const text = await readToml();
  const catalog = await readSocialCatalog();
  const social = listSocial(text, catalog);
  return {
    toml: text,
    site: {
      title: getValue(text, "", "title") || "",
      description: getValue(text, "params", "description") || "",
      keywords: getValue(text, "params", "keywords") || "",
      profileTitle: getValue(text, "params.home.profile", "title") || "",
      subtitle: getValue(text, "params.home.profile", "subtitle") || "",
      avatarURL: getValue(text, "params.home.profile", "avatarURL") || "",
      typeit: getValue(text, "params.home.profile", "typeit") === "true",
      titleImage: null,
    },
    social,
    analytics: readAnalytics(text),
    // 下拉框用去重后的清单；同一平台的其它写法在 aliases 里
    catalog: catalog.merged.map((c) => ({
      key: c.key.charAt(0).toUpperCase() + c.key.slice(1),
      raw: c.key,
      label: c.label,
      icon: c.icon,
      prefix: c.prefix,
      template: c.template,
      url: c.url,
      aliases: c.aliases,
    })),
  };
}

export async function saveSiteSettings(payload) {
  const catalog = await readSocialCatalog();
  const mergedByKey = catalog.byMerged;
  let text = await readToml();

  const title = String(payload.siteTitle || "").trim();
  const description = String(payload.description || "").trim();
  const profileTitle = String(payload.profileTitle || "").trim();
  const subtitle = String(payload.subtitle || "").trim();

  const edits = [["", "title", title]];
  edits.push(["params", "title", title]);
  edits.push(["params", "description", description]);
  edits.push(["params.header.title", "name", title]);
  // 首页大标题留空时回落到站点名称，避免首页只剩副标题
  edits.push(["params.home.profile", "title", profileTitle || title]);
  edits.push(["params.home.profile", "subtitle", subtitle]);

  for (const [section, key, value] of edits) {
    if (payload.only && !payload.only.includes(`${section}.${key}`)) continue;
    text = setValue(text, section, key, value);
  }

  // 社交平台：以提交的整份清单为准，未提交的旧条目清空（主题会跳过空值）
  if (Array.isArray(payload.social)) {
    const wanted = new Map(); // 主键小写 → { key, value, meta }
    for (const item of payload.social) {
      const value = String(item && item.value != null ? item.value : "").trim();
      if (!value) continue;
      const key = canonicalKey(item.key);
      if (!key) throw new Error(`不支持的社交平台：${item.key}`);
      const meta = mergedByKey.get(key.toLowerCase()) || {};
      wanted.set(key.toLowerCase(), { key, value, meta });
    }

    const existing = readSection(text, "params.social");
    const seen = new Set();
    for (const item of Object.values(existing)) {
      const primary = canonicalKey(item.key);
      if (!primary) continue;
      const k = primary.toLowerCase();
      if (seen.has(k)) {
        // 同一平台的别名键（如 Youtubecustom）留着也是重复项，直接清掉
        if (item.value) text = setRaw(text, "params.social", item.key, tomlString(""));
        continue;
      }
      seen.add(k);
      const hit = wanted.get(k);
      if (hit) {
        text = setRaw(text, "params.social", item.key, socialValueExpr(hit.meta, hit.value));
        wanted.delete(k);
      } else if (item.value) {
        text = setRaw(text, "params.social", item.key, tomlString(""));
      }
    }
    for (const { key, value, meta } of wanted.values()) {
      text = setRaw(text, "params.social", key, socialValueExpr(meta, value));
    }
  }

  if (payload.analytics) {
    text = saveAnalytics(text, payload.analytics);
  }

  await writeToml(text);
  return readSiteSettings();
}

// ---------- 头像 ----------

const AVATAR_EXT = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export function avatarExtFor(contentType) {
  return AVATAR_EXT[String(contentType || "").split(";")[0].trim().toLowerCase()] || null;
}

export async function saveAvatarFile(buffer, contentType) {
  const ext = avatarExtFor(contentType);
  if (!ext) throw new Error("只支持 JPG / PNG / WebP / GIF 格式的图片");
  if (!buffer || !buffer.length) throw new Error("图片内容为空");
  if (buffer.length > 12 * 1024 * 1024) throw new Error("图片超过 12MB，请先压缩");

  await fsp.mkdir(AVATAR_DIR, { recursive: true });
  const target = path.join(AVATAR_DIR, `profile.${ext}`);
  await fsp.writeFile(target, buffer);

  // 其余格式的旧头像清掉，避免 static/images 里堆垃圾
  for (const other of ["jpg", "png", "webp", "gif"]) {
    if (other === ext) continue;
    await fsp.rm(path.join(AVATAR_DIR, `profile.${other}`), { force: true });
  }

  // 顺手用 macOS 自带的 sips 压到合理尺寸；压不了不影响主流程
  await shrinkWithSips(target).catch(() => {});
  const version = Date.now().toString(36);
  const avatarURL = `/images/profile.${ext}?v=${version}`;
  let text = await readToml();
  text = setValue(text, "params.home.profile", "avatarURL", avatarURL);
  await writeToml(text);
  return { avatarURL, file: path.relative(ROOT, target).split(path.sep).join("/") };
}

// 头像不该有 4MB 原图：超过 512px 才用 sips 缩放，小图原样保留（避免无意义重编码掉画质）
function sipsRun(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("sips", args, { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error("sips 执行失败"))));
  });
}

async function shrinkWithSips(file) {
  const info = await sipsRun(["-g", "pixelWidth", "-g", "pixelHeight", file]);
  const w = Number((info.match(/pixelWidth:\s*(\d+)/) || [])[1] || 0);
  const h = Number((info.match(/pixelHeight:\s*(\d+)/) || [])[1] || 0);
  if (!w || !h || Math.max(w, h) <= 512) return;
  await sipsRun(["-Z", "512", file, "--out", file]);
}
