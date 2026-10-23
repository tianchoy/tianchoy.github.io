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

function assertInsidePost(abs) {
  const target = path.resolve(abs);
  const base = path.resolve(POSTS_DIR);
  if (!target.startsWith(base + path.sep)) throw new Error(`路径不在 content/posts 内：${abs}`);
  if (!/\.(md|markdown)$/i.test(target)) throw new Error(`只能删除 Markdown 文件：${abs}`);
  return target;
}

// files 是相对于仓库根目录的路径，例如 content/posts/diary/xxx.md
export async function deletePosts(files) {
  const list = Array.isArray(files) ? files : [];
  if (!list.length) throw new Error("没有指定要删除的文章");
  if (list.length > 50) throw new Error("一次最多删除 50 篇");

  const deleted = [];
  for (const rel of list) {
    const abs = assertInsidePost(path.join(ROOT, String(rel)));
    await fsp.rm(abs, { force: true });
    deleted.push(String(rel));
  }
  return deleted;
}

export { POSTS_DIR as CONTENT_POSTS_DIR };
