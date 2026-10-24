// content/posts 下的文章扫描、frontmatter 解析与删除
//
// 只做「读」和「删」：改文章仍在发布页/编辑器里做，避免这里越权覆盖用户手改的 frontmatter。

import path from "node:path";
import { promises as fsp } from "node:fs";
import { ROOT } from "./site-config.mjs";

export const CONTENT_DIR = path.join(ROOT, "content");
export const POSTS_DIR = path.join(CONTENT_DIR, "posts");
const SITE_URL = "https://tianchoy.github.io";

const CJK_RE = /[\u4e00-\u9fa5\u3400-\u4dbf]/g;
const WORD_RE = /[A-Za-z0-9_]+(?:['-][A-Za-z0-9_]+)*/g;

function unquoteValue(v) {
  let s = String(v == null ? "" : v).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

function parseArrayValue(raw) {
  const s = String(raw || "").trim();
  const m = s.match(/^\[([\s\S]*)\]$/);
  if (!m) return null;
  return m[1]
    .split(",")
    .map((x) => unquoteValue(x))
    .filter(Boolean);
}

// YAML（---）和 TOML（+++）都支持，够读现有文章
function parseFrontMatter(text) {
  const m = text.match(/^\uFEFF?(?:---|\+\+\+)[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\+\+\+)[ \t]*(?:\r?\n|$)/);
  if (!m) return { data: {}, body: text };
  const data = {};
  let lastKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*[:=]\s*(.*)$/);
    if (kv) {
      const key = kv[1].toLowerCase();
      const raw = kv[2].trim();
      lastKey = key;
      const arr = parseArrayValue(raw);
      data[key] = arr !== null ? arr : unquoteValue(raw);
      continue;
    }
    const li = line.match(/^\s*-\s+(.*)$/);
    if (li && lastKey) {
      if (!Array.isArray(data[lastKey])) data[lastKey] = data[lastKey] ? [data[lastKey]] : [];
      data[lastKey].push(unquoteValue(li[1]));
    }
  }
  return { data, body: text.slice(m[0].length) };
}

function toArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (v == null || v === "") return [];
  return String(v)
    .split(",")
    .map((s) => unquoteValue(s))
    .filter(Boolean);
}

function countWords(body) {
  const s = String(body || "");
  const cjk = (s.match(CJK_RE) || []).length;
  const words = (s.match(WORD_RE) || []).length;
  return cjk + words;
}

function dateOf(data, stat) {
  const raw = data.date || data.publishdate || data.pubdate || data.lastmod;
  if (raw) {
    // Hugo 常见写法：2023-09-14 / 2023-09-14T10:00:00+08:00 / 2023-09-14 10:00:00
    const norm = String(raw).trim().replace(" ", "T");
    const d = new Date(norm);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return stat.mtime;
}

function isoLocal(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function permalinkOf(absFile) {
  const rel = path.relative(CONTENT_DIR, absFile).split(path.sep).join("/").replace(/\.md$/, "");
  // content/posts/vue3/x.md → /posts/vue3/x/
  return `${SITE_URL}/${rel}/`;
}

async function walk(dir, out) {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(abs, out);
    } else if (/\.(md|markdown)$/i.test(e.name)) {
      out.push(abs);
    }
  }
}

export async function listPosts() {
  const files = [];
  await walk(POSTS_DIR, files);

  const posts = [];
  for (const abs of files) {
    let text = "";
    let stat;
    try {
      stat = await fsp.stat(abs);
      text = await fsp.readFile(abs, "utf-8");
    } catch {
      continue;
    }
    const { data, body } = parseFrontMatter(text);
    const relDir = path.relative(POSTS_DIR, path.dirname(abs)).split(path.sep).filter(Boolean);
    const fmCats = toArray(data.categories || data.category);
    const cats = fmCats.length ? fmCats : relDir.length ? [relDir[0]] : [];
    const d = dateOf(data, stat);
    posts.push({
      file: path.relative(ROOT, abs).split(path.sep).join("/"),
      abs,
      title: String(data.title || path.basename(abs, ".md")),
      date: isoLocal(d),
      dateFull: d.toISOString(),
      categories: cats,
      tags: toArray(data.tags),
      draft: String(data.draft || "").toLowerCase() === "true",
      size: stat.size,
      words: countWords(body),
      permalink: permalinkOf(abs),
      mtime: stat.mtime.getTime(),
    });
  }

  posts.sort((a, b) => {
    const t = new Date(b.date).getTime() - new Date(a.date).getTime();
    return t !== 0 ? t : b.mtime - a.mtime;
  });
  return posts;
}

function assertInsidePost(abs, action = "操作") {
  const target = path.resolve(abs);
  const base = path.resolve(POSTS_DIR);
  if (!target.startsWith(base + path.sep)) throw new Error(`路径不在 content/posts 内：${abs}`);
  if (!/\.(md|markdown)$/i.test(target)) throw new Error(`只能${action} Markdown 文件：${abs}`);
  return target;
}

// files 是相对于仓库根目录的路径，例如 content/posts/diary/xxx.md
export async function deletePosts(files) {
  const list = Array.isArray(files) ? files : [];
  if (!list.length) throw new Error("没有指定要删除的文章");
  if (list.length > 50) throw new Error("一次最多删除 50 篇");

  const deleted = [];
  for (const rel of list) {
    const abs = assertInsidePost(path.join(ROOT, String(rel)), "删除");
    await fsp.rm(abs, { force: true });
    deleted.push(String(rel));
  }
  return deleted;
}

// ---------- 单篇读写（文章管理里的「编辑」） ----------

function relOf(abs) {
  return path.relative(ROOT, abs).split(path.sep).join("/");
}

function splitFrontMatter(text) {
  const m = text.match(/^\uFEFF?(---|\+\+\+)[ \t]*\r?\n([\s\S]*?)\r?\n\1[ \t]*(?:\r?\n|$)/);
  if (!m) return null;
  return { delim: m[1], lines: m[2].split(/\r?\n/), body: text.slice(m[0].length) };
}

function setFrontMatterKey(lines, key, value, sep) {
  const re = new RegExp(`^${key}\\s*[:=]`);
  const idx = lines.findIndex((l) => re.test(l));
  const line = `${key}${sep}${value}`;
  if (idx >= 0) lines[idx] = line;
  else lines.push(line);
}

function dropFrontMatterKey(lines, key) {
  const re = new RegExp(`^${key}\\s*[:=]`);
  for (let i = lines.length - 1; i >= 0; i--) if (re.test(lines[i])) lines.splice(i, 1);
}

function yamlList(arr) {
  return `[${arr.map((x) => JSON.stringify(x)).join(", ")}]`;
}

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}+08:00`;
}

// 读一篇用于编辑器：返回 frontmatter 里编辑器关心的字段 + 正文
export async function readPost(rel) {
  const abs = assertInsidePost(path.join(ROOT, String(rel || "")), "读取");
  const text = await fsp.readFile(abs, "utf-8");
  const { data, body } = parseFrontMatter(text);
  const relDir = path.relative(POSTS_DIR, path.dirname(abs)).split(path.sep).filter(Boolean);
  const cats = toArray(data.categories || data.category);
  return {
    file: relOf(abs),
    title: String(data.title || path.basename(abs, ".md")),
    categories: cats.length ? cats : relDir.length ? [relDir[0]] : [],
    tags: toArray(data.tags),
    date: String(data.date || ""),
    draft: String(data.draft || "").toLowerCase() === "true",
    content: body.replace(/^\s*\n/, "").replace(/\s+$/, "") + "\n",
    permalink: permalinkOf(abs),
  };
}

// 保存编辑：只改 title / categories / tags / 正文，其余 frontmatter（description、layout、
// author 之类用户手写的键）原样保留，顺序也不动。文件路径不变，所以线上链接不会变。
export async function savePost({ file, category, title, content, tags }) {
  const t = String(title || "").trim();
  if (!t) throw new Error("标题不能为空");
  const body = String(content || "");
  if (!body.trim()) throw new Error("正文不能为空");
  const cat = String(category || "").trim();
  if (!cat) throw new Error("分类不能为空");

  const abs = assertInsidePost(path.join(ROOT, String(file || "")), "编辑");
  const old = await fsp.readFile(abs, "utf-8");
  const fm = splitFrontMatter(old);

  const tagList = (Array.isArray(tags) ? tags : []).map((x) => String(x).trim()).filter(Boolean);
  let out;
  if (!fm) {
    // 原本没有 frontmatter，补一份最小可用的
    out =
      `---\ntitle: ${JSON.stringify(t)}\n` +
      `date: ${nowStamp()}\n` +
      `categories: ${yamlList([cat])}\n` +
      (tagList.length ? `tags: ${yamlList(tagList)}\n` : "") +
      `draft: false\n---\n\n${body.replace(/\s+$/, "")}\n`;
  } else {
    const sep = fm.delim === "+++" ? " = " : ": ";
    const lines = fm.lines.slice();
    setFrontMatterKey(lines, "title", JSON.stringify(t), sep);
    const hasDate = lines.some((l) => /^date\s*[:=]/.test(l));
    if (!hasDate) setFrontMatterKey(lines, "date", nowStamp(), sep);
    setFrontMatterKey(lines, "categories", yamlList([cat]), sep);
    if (tagList.length) setFrontMatterKey(lines, "tags", yamlList(tagList), sep);
    else dropFrontMatterKey(lines, "tags");
    out = `${fm.delim}\n${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n${fm.delim}\n\n${body.replace(/\s+$/, "")}\n`;
  }

  await fsp.writeFile(abs, out, "utf-8");
  return { file: relOf(abs), permalink: permalinkOf(abs) };
}

export { POSTS_DIR as CONTENT_POSTS_DIR };
