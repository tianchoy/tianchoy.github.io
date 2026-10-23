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
    out[lower] = { key, raw: stripComment(m[3]).trim(), value: unquote(stripComment(m[3])) };
  }
  return out;
}

export function getValue(text, sectionName, key) {
  const sec = readSection(text, sectionName);
  const hit = sec[String(key).toLowerCase()];
  return hit ? hit.value : undefined;
}

// 在指定段里设置 key：命中就改值（保留原缩进与键名大小写），否则追加到段末
export function setValue(text, sectionName, key, value) {
  const { lines, sections } = scan(text);
  const sec = findSection(sections, sectionName);

  if (!sec) {
    // 段不存在：追加到文件末尾（仅支持一级 params.xxx 形式，够本项目用）
    const block = [`[${sectionName}]`, `  ${key} = ${tomlString(value)}`, ""];
    const base = text.endsWith("\n") ? text : text + "\n";
    return base + "\n" + block.join("\n");
  }

  const re = new RegExp("^(\\s*)" + escapeRe(key) + "\\s*=", "i");
  for (let i = sec.start; i < sec.end; i++) {
    if (re.test(lines[i])) {
      const indent = lines[i].match(re)[1];
      lines[i] = `${indent}${key} = ${tomlString(value)}`;
      return lines.join("\n");
    }
  }

  let insertAt = sec.start;
  for (let i = sec.start; i < sec.end; i++) {
    if (lines[i].trim() && !/^\s*#/.test(lines[i])) insertAt = i + 1;
  }
  lines.splice(insertAt, 0, `${sec.indent}${key} = ${tomlString(value)}`);
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
let catalogCache = null;
export async function readSocialCatalog() {
  if (catalogCache) return catalogCache;
  const raw = await fsp.readFile(SOCIAL_YML, "utf-8");
  const out = [];
  let cur = null;
  for (const line of raw.split("\n")) {
    const l = line.replace(/\s+$/, "");
    if (!l || /^\s*#/.test(l)) continue;
    let m = l.match(/^([A-Za-z0-9_]+):\s*$/);
    if (m) {
      cur = { key: m[1], weight: 999, prefix: "", template: "", url: "", label: m[1], icon: "" };
      out.push(cur);
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
  catalogCache = out.sort((a, b) => a.weight - b.weight);
  return catalogCache;
}

// 名字转成 hugo.toml 里惯用的键名：github → Github（查找时大小写不敏感，不影相功能）
function canonicalKey(rawKey) {
  const k = String(rawKey).trim();
  if (!k) return "";
  const known = (catalogCache || []).find((c) => c.key.toLowerCase() === k.toLowerCase());
  if (!known) return "";
  return known.key.charAt(0).toUpperCase() + known.key.slice(1);
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
    const label = (catalog.find((c) => c.key.toLowerCase() === item.key.toLowerCase()) || {}).label || item.key;
    entries.push({ key: item.key, label, value: item.value });
  }
  return entries;
}

export function socialUrl(entry, catalog) {
  const c = catalog.find((x) => x.key.toLowerCase() === String(entry.key).toLowerCase());
  const v = String(entry.value || "");
  if (!c) return v;
  if (/^https?:\/\//i.test(v) || /^mailto:/i.test(v) || v.startsWith("/")) return v;
  if (c.template) return c.template.replace("%v", v);
  if (c.prefix) return c.prefix.replace(/\/+$/, "") + "/" + v.replace(/^\/+/, "");
  return v;
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
    catalog: catalog.map((c) => ({
      key: c.key.charAt(0).toUpperCase() + c.key.slice(1),
      raw: c.key,
      label: c.label,
      icon: c.icon,
      prefix: c.prefix,
      template: c.template,
      url: c.url,
    })),
  };
}

export async function saveSiteSettings(payload) {
  const catalog = await readSocialCatalog();
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
    const wanted = new Map();
    for (const item of payload.social) {
      const value = String(item && item.value != null ? item.value : "").trim();
      if (!value) continue;
      const key = canonicalKey(item.key);
      if (!key) throw new Error(`不支持的社交平台：${item.key}`);
      wanted.set(key.toLowerCase(), { key, value });
    }
    const existing = readSection(text, "params.social");
    for (const item of Object.values(existing)) {
      const k = item.key.toLowerCase();
      if (wanted.has(k)) {
        text = setValue(text, "params.social", item.key, wanted.get(k).value);
        wanted.delete(k);
      } else if (item.value) {
        text = setValue(text, "params.social", item.key, "");
      }
    }
    for (const { key, value } of wanted.values()) {
      text = setValue(text, "params.social", key, value);
    }
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
