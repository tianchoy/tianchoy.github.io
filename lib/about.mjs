// content/about.md 的读写。
// 只动正文和 title，其余 frontmatter（description / date / layout）原样保留，
// 免得后台改一次就把 Hugo 的渲染参数吃掉。
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ABOUT_FILE = path.join(ROOT, "content", "about.md");

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/;

function splitFrontmatter(text) {
  const m = String(text).match(FM_RE);
  if (!m) return { fm: "", body: String(text) };
  return { fm: m[1], body: String(text).slice(m[0].length) };
}

function yamlString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function readFm(fm, key) {
  const m = fm.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
  if (!m) return "";
  return m[1].trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function writeFm(fm, key, value) {
  const line = `${key}: ${yamlString(value)}`;
  const re = new RegExp(`^${key}:.*$`, "m");
  if (re.test(fm)) return fm.replace(re, line);
  return fm ? `${fm}\n${line}` : line;
}

export async function readAboutPage() {
  const text = await fsp.readFile(ABOUT_FILE, "utf8");
  const { fm, body } = splitFrontmatter(text);
  return {
    title: readFm(fm, "title"),
    description: readFm(fm, "description"),
    body: body.replace(/^\s*\n/, "").replace(/\s+$/, ""),
    file: path.relative(ROOT, ABOUT_FILE),
  };
}

export async function saveAboutPage({ title, body }) {
  const text = await fsp.readFile(ABOUT_FILE, "utf8");
  const { fm } = splitFrontmatter(text);

  let nextFm = fm;
  const cleanTitle = String(title == null ? "" : title).trim();
  if (cleanTitle) nextFm = writeFm(nextFm, "title", cleanTitle);

  // 正文统一 LF，末尾补一个换行，frontmatter 与正文之间固定空一行
  const cleanBody = String(body == null ? "" : body).replace(/\r\n/g, "\n").trim();
  const out = `---\n${nextFm}\n---\n\n${cleanBody}\n`;
  await fsp.writeFile(ABOUT_FILE, out, "utf8");
  return readAboutPage();
}
