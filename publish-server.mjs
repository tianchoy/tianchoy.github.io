// 本地写作台服务（仅绑定 127.0.0.1）
//
// 页面：
//   /publish     发布文章
//   /manage      文章管理
//   /edit/about  编辑「关于」页正文
//   /admin       站点设置（头像 / 名称 / 副标题 / 社交链接）
//   /            预览构建后的站点（public/index.html）
//
// 用法：双击根目录的「写作台.app」，或命令行 `bun run publish` / `npm run publish`。

import http from "node:http";
import nodeFs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  ROOT,
  readSiteSettings,
  saveSiteSettings,
  saveAvatarFile,
  avatarExtFor,
} from "./lib/site-config.mjs";
import { listPosts, deletePosts, readPost, savePost, postPermalink } from "./lib/posts.mjs";
import { readAboutPage, saveAboutPage } from "./lib/about.mjs";
import { suggestTags } from "./lib/auto-tags.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, "public");
const WEB_DIR = path.join(ROOT, "web");
const CONTENT_DIR = path.join(ROOT, "content", "posts");
const PORT = Number(process.env.PORT) || 4321;
const HOST = "127.0.0.1";

// 双击 .app 启动时 PATH 里不会有 Homebrew / bun 的目录，这里补齐
const EXTRA_PATH = ["/opt/homebrew/bin", "/usr/local/bin", path.join(process.env.HOME || "", ".bun/bin")];
const PATH_ENV = { ...process.env, PATH: [...EXTRA_PATH, process.env.PATH || "/usr/bin:/bin"].join(":") };

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const PAGES = {
  "/publish": "publish.html",
  "/manage": "manage.html",
  // 不能直接用 /about：会和构建产物预览里的 /about/index.html 抢路由
  "/edit/about": "about.html",
  "/admin": "admin.html",
};

// ---------- 基础工具 ----------

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function readBody(req, limit = 16 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let done = false;
    req.on("data", (chunk) => {
      if (done) return;
      size += chunk.length;
      if (size > limit) {
        done = true;
        const err = new Error(`请求体过大（上限 ${Math.round(limit / 1024 / 1024)}MB）`);
        err.status = 413;
        // 不 destroy 连接，让上层还能把 413 回给浏览器；只是不再收数据
        req.pause();
        reject(err);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!done) resolve(Buffer.concat(chunks));
    });
    req.on("error", (e) => {
      if (!done) reject(e);
    });
  });
}

async function readJSON(req) {
  const buf = await readBody(req);
  if (!buf.length) return {};
  try {
    return JSON.parse(buf.toString("utf-8"));
  } catch {
    throw new Error("无效的 JSON 请求体");
  }
}

function sanitizeFilename(name) {
  const s = String(name)
    .trim()
    // 路径分隔符与控制字符会让文件写到 content/posts 外面，先彻底剔掉
    // eslint-disable-next-line no-control-regex
    .replace(/[/\\:*?"<>|\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    // 前导点会变成隐藏文件，前导横线在命令行里会被当成参数
    .replace(/^[.\-]+|[.\-]+$/g, "")
    // macOS 单个文件名上限 255 字节，中文一个字 3 字节，留足余量
    .slice(0, 80);
  return s || "untitled";
}

// 分类名会成为 content/posts 下的目录名，规则同文件名，另外不允许只剩点号
function sanitizeDirName(name) {
  const s = sanitizeFilename(name);
  return s === "untitled" ? "" : s;
}

// 建目录前先按「忽略大小写」找现成的：仓库里是 Vue3，用户打成 vue3 时
// 不能再建一个 vue3 目录——Hugo 会把两者小写成同一个 URL，直接互相覆盖
async function resolveCategoryDir(category) {
  const safe = sanitizeDirName(category);
  if (!safe) {
    const e = new Error("分类名不合法（不能为空，也不能只由符号组成）");
    e.status = 400;
    throw e;
  }
  let entries = [];
  try {
    entries = await fsp.readdir(CONTENT_DIR, { withFileTypes: true });
  } catch {
    /* 目录还不存在 */
  }
  const hit = entries.find((e) => e.isDirectory() && e.name.toLowerCase() === safe.toLowerCase());
  return hit ? hit.name : safe;
}

function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  // 时区偏移按本机算，别写死 +08:00（换台机器或改了时区就会写错时间）
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

// ---------- 文章 ----------

async function readCategories() {
  const cats = new Set();
  try {
    const top = await fsp.readdir(CONTENT_DIR, { withFileTypes: true });
    for (const e of top) if (e.isDirectory()) cats.add(e.name);
  } catch {
    /* content/posts 可能不存在 */
  }

  async function walk(dir) {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(p);
      } else if (e.name.endsWith(".md")) {
        try {
          const txt = await fsp.readFile(p, "utf-8");
          const m = txt.match(/categories:\s*\[([^\]]*)\]/);
          if (m) {
            for (const part of m[1].split(",")) {
              const c = part.trim().replace(/^["']|["']$/g, "");
              if (c) cats.add(c);
            }
          }
        } catch {
          /* ignore */
        }
      }
    }
  }
  await walk(CONTENT_DIR);
  return [...cats].sort((a, b) => a.localeCompare(b, "zh"));
}

// 标签统一去重、去空白，并限制数量：标签太多详情页会挤成一片
function cleanTags(tags, max = 8) {
  const out = [];
  for (const raw of Array.isArray(tags) ? tags : []) {
    const t = String(raw == null ? "" : raw).replace(/[\r\n\t]/g, " ").trim();
    if (!t || t.length > 24) continue;
    if (out.includes(t)) continue;
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

async function createPost({ category, title, content, tags }) {
  const slug = sanitizeFilename(title);
  const catDir = await resolveCategoryDir(category);
  const dir = path.join(CONTENT_DIR, catDir);
  await fsp.mkdir(dir, { recursive: true });

  let file = path.join(dir, slug + ".md");
  let n = 2;
  for (;;) {
    try {
      await fsp.access(file);
      file = path.join(dir, `${slug}-${n}.md`);
      n++;
    } catch {
      break;
    }
  }

  const tagList = cleanTags(tags)
    .map((t) => JSON.stringify(t))
    .join(", ");

  const fm =
    `---\ntitle: ${JSON.stringify(title)}\n` +
    `date: ${nowLocal()}\n` +
    `categories: [${JSON.stringify(catDir)}]\n` +
    (tagList ? `tags: [${tagList}]\n` : "") +
    `draft: false\n---\n\n${String(content).replace(/\s+$/, "")}\n`;

  await fsp.writeFile(file, fm, "utf-8");

  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  return { file: rel, permalink: postPermalink(file), absFile: file, category: catDir };
}

// ---------- 部署 ----------

function doDeploy() {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn("bash", ["deploy.sh"], {
      cwd: ROOT,
      env: PATH_ENV,
    });
    let out = "";
    let settled = false;
    const finish = (r) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(r);
    };
    // 网络卡住时 git push 可能一直不返回，别让请求和后续发布无限等下去
    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* ignore */
      }
      finish({ ok: false, code: -1, output: out + "\n部署超时（超过 5 分钟），已终止", ms: Date.now() - started });
    }, 5 * 60 * 1000);

    const push = (d) => {
      out += d;
      if (out.length > 200000) out = out.slice(-100000);
    };
    child.stdout.on("data", push);
    child.stderr.on("data", push);
    child.on("error", (e) =>
      finish({ ok: false, code: -1, output: out + "\n" + e.message, ms: Date.now() - started })
    );
    child.on("close", (code) =>
      finish({ ok: code === 0, code, output: out.slice(-8000), ms: Date.now() - started })
    );
  });
}

// 发布串行化：两次点击/两个标签页同时保存时，第二份 git 操作会撞上
// .git/index.lock，或者把前一次的 commit 顶掉。这里排队执行。
let deployQueue = Promise.resolve();
function runDeploy() {
  const task = deployQueue.then(doDeploy, doDeploy);
  deployQueue = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

// 前端历史上用了两种字段：publish 传 dryRun（true=不发布），
// site/about/delete 传 deploy（true=发布）。两种都认，避免改一处漏一处。
function shouldDeploy(payload) {
  const p = payload || {};
  if (typeof p.dryRun === "boolean") return !p.dryRun;
  if (typeof p.deploy === "boolean") return p.deploy;
  return true;
}

async function deployOrSkip(skip) {
  if (skip) return { ok: true, code: 0, skipped: true, output: "(已跳过部署，仅在本地生成文件)", ms: 0 };
  return runDeploy();
}

// ---------- 静态文件 ----------

function sendFile(res, filePath, cache = "no-store") {
  const ext = path.extname(filePath).toLowerCase();
  const stream = nodeFs.createReadStream(filePath);
  stream.on("open", () => {
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": cache });
    // HEAD 只回头部，别把整个文件也流出去
    if (res.req && res.req.method === "HEAD") {
      stream.destroy();
      res.end();
    }
  });
  stream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
    } else {
      res.destroy();
    }
  });
  stream.pipe(res);
}

async function resolveFile(baseDir, relPath) {
  let clean;
  try {
    clean = decodeURIComponent(relPath);
  } catch {
    return null; // 非法百分号编码，按「不存在」处理，别一路冒到 500
  }
  if (clean.includes("\u0000")) return null;

  const base = path.resolve(baseDir);
  const target = path.resolve(base, clean);
  // 用 relative 判断包含关系：startsWith 会把 sibling 目录（/web-evil）误判成在 /web 内
  const rel = path.relative(base, target);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;

  try {
    const stat = await fsp.stat(target);
    if (stat.isDirectory()) {
      const idx = path.join(target, "index.html");
      await fsp.access(idx);
      return idx;
    }
    return target;
  } catch {
    return null;
  }
}

// ---------- 同源保护 ----------
//
// 服务只监听 127.0.0.1，但浏览器里任何一个网页都能往 127.0.0.1 发 POST
// （CSRF），也能靠 DNS rebinding 把本站伪装成同源。写操作一旦被别的站点触发，
// 就等于让外部网页替我们发文章、改配置、关服务。
// 这里要求：Host 必须是本机地址，且带上来的 Origin 也必须是本机地址。
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

function isLocalHostname(value) {
  const h = String(value || "").trim().toLowerCase();
  if (!h) return false;
  return LOCAL_HOSTNAMES.has(h);
}

function isLocalRequest(req) {
  const host = String(req.headers.host || "").toLowerCase().replace(/:\d+$/, "");
  if (!isLocalHostname(host)) return false;
  const origin = req.headers.origin;
  if (!origin) return true; // 同源导航、curl、本地脚本都不带 Origin
  try {
    return isLocalHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
}

// ---------- 路由 ----------

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }
  const pathname = url.pathname;

  if (!isLocalRequest(req)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Forbidden：只接受来自本机的请求");
  }

  try {
    // —— 页面
    if (PAGES[pathname]) {
      const file = path.join(WEB_DIR, PAGES[pathname]);
      return sendFile(res, file);
    }

    if (pathname === "/" || pathname === "") {
      const index = path.join(PUBLIC_DIR, "index.html");
      try {
        await fsp.access(index);
        return sendFile(res, index, "no-cache");
      } catch {
        res.writeHead(302, { Location: "/publish" });
        return res.end();
      }
    }

    // —— UI 资源
    if (pathname.startsWith("/ui/")) {
      const file = await resolveFile(WEB_DIR, pathname.slice("/ui/".length));
      if (!file) {
        res.writeHead(404);
        return res.end("Not Found");
      }
      return sendFile(res, file);
    }

    // —— 静态图片：优先读 static/，让刚换的头像不用等构建就能预览
    if (pathname.startsWith("/images/")) {
      const rel = pathname.slice("/images/".length);
      const fromStatic = await resolveFile(path.join(ROOT, "static", "images"), rel);
      if (fromStatic) return sendFile(res, fromStatic, "no-cache");
      const fromPublic = await resolveFile(path.join(PUBLIC_DIR, "images"), rel);
      if (fromPublic) return sendFile(res, fromPublic, "no-cache");
      res.writeHead(404);
      return res.end("Not Found");
    }

    // —— API
    if (pathname === "/api/ping") {
      return sendJSON(res, 200, { ok: true, app: "写作台", root: ROOT, port: PORT, pid: process.pid });
    }

    if (pathname === "/api/categories") {
      return sendJSON(res, 200, { ok: true, categories: await readCategories() });
    }

    if (pathname === "/api/site" && req.method === "GET") {
      const { site, social, analytics, catalog } = await readSiteSettings();
      return sendJSON(res, 200, { ok: true, site, social, analytics, catalog });
    }

    if (pathname === "/api/site" && req.method === "POST") {
      const payload = await readJSON(req);
      if (!String(payload.siteTitle || "").trim()) {
        return sendJSON(res, 400, { ok: false, error: "站点名称不能为空" });
      }
      const result = await saveSiteSettings(payload);
      const deploy = await deployOrSkip(!shouldDeploy(payload));
      return sendJSON(res, deploy.ok ? 200 : 500, {
        ok: deploy.ok,
        site: result.site,
        social: result.social,
        analytics: result.analytics,
        catalog: result.catalog,
        error: deploy.ok ? undefined : `部署失败（退出码 ${deploy.code}）`,
        deploy,
      });
    }

    if (pathname === "/api/about" && req.method === "GET") {
      return sendJSON(res, 200, { ok: true, about: await readAboutPage() });
    }

    if (pathname === "/api/about" && req.method === "POST") {
      const payload = await readJSON(req);
      if (!String(payload.body || "").trim()) {
        return sendJSON(res, 400, { ok: false, error: "关于页正文不能全是空白" });
      }
      const about = await saveAboutPage(payload);
      const deploy = await deployOrSkip(!shouldDeploy(payload));
      return sendJSON(res, deploy.ok ? 200 : 500, {
        ok: deploy.ok,
        about,
        permalink: "/about/",
        error: deploy.ok ? undefined : `部署失败（退出码 ${deploy.code}）`,
        deploy,
      });
    }

    if (pathname === "/api/avatar" && req.method === "POST") {
      const type = req.headers["content-type"] || "";
      if (!avatarExtFor(type)) {
        return sendJSON(res, 400, { ok: false, error: "只支持 JPG / PNG / WebP / GIF" });
      }
      const buf = await readBody(req, 13 * 1024 * 1024);
      const { avatarURL, file } = await saveAvatarFile(buf, type);
      return sendJSON(res, 200, { ok: true, avatarURL, file });
    }

    // 发布前给标签框补位：不足 5 个时按标题/正文/分类算出建议
    if (pathname === "/api/suggest-tags" && req.method === "POST") {
      const payload = await readJSON(req);
      const tags = suggestTags({
        title: payload.title,
        content: payload.content,
        category: payload.category,
        existing: Array.isArray(payload.existing) ? payload.existing : [],
        need: 5,
      });
      return sendJSON(res, 200, { ok: true, tags });
    }

    if (pathname === "/api/publish" && req.method === "POST") {
      const payload = await readJSON(req);
      const category = String(payload.category || "").trim();
      const title = String(payload.title || "").trim();
      const content = String(payload.content || "");
      if (!category || !title) return sendJSON(res, 400, { ok: false, error: "分类和标题必填" });
      if (!content.trim()) return sendJSON(res, 400, { ok: false, error: "正文不能为空" });

      const created = await createPost({
        category,
        title,
        content,
        tags: cleanTags(payload.tags),
      });
      const deploy = await deployOrSkip(!shouldDeploy(payload));
      return sendJSON(res, deploy.ok ? 200 : 500, {
        ok: deploy.ok,
        file: created.file,
        permalink: created.permalink,
        error: deploy.ok ? undefined : `部署失败（退出码 ${deploy.code}）`,
        deploy,
      });
    }

    if (pathname === "/api/deploy" && req.method === "POST") {
      const deploy = await runDeploy();
      return sendJSON(res, deploy.ok ? 200 : 500, {
        ok: deploy.ok,
        error: deploy.ok ? undefined : `部署失败（退出码 ${deploy.code}）`,
        deploy,
      });
    }

    // —— 文章管理
    if (pathname === "/api/posts" && req.method === "GET") {
      const posts = await listPosts();
      return sendJSON(res, 200, {
        ok: true,
        posts: posts.map(({ abs, mtime, ...rest }) => rest),
        stats: {
          total: posts.length,
          drafts: posts.filter((p) => p.draft).length,
          words: posts.reduce((n, p) => n + p.words, 0),
        },
      });
    }

    if (pathname === "/api/post" && req.method === "GET") {
      const file = url.searchParams.get("file") || "";
      if (!file) return sendJSON(res, 400, { ok: false, error: "缺少 file 参数" });
      try {
        const post = await readPost(file);
        return sendJSON(res, 200, { ok: true, post, categories: await readCategories() });
      } catch (e) {
        if (e && e.code === "ENOENT") return sendJSON(res, 404, { ok: false, error: "文件不存在，可能已被删除" });
        throw e;
      }
    }

    if (pathname === "/api/post" && req.method === "POST") {
      const payload = await readJSON(req);
      const file = String(payload.file || "").trim();
      const category = String(payload.category || "").trim();
      const title = String(payload.title || "").trim();
      const content = String(payload.content || "");
      if (!file) return sendJSON(res, 400, { ok: false, error: "缺少 file 参数" });
      if (!title) return sendJSON(res, 400, { ok: false, error: "标题不能为空" });
      if (!category) return sendJSON(res, 400, { ok: false, error: "分类不能为空" });
      if (!content.trim()) return sendJSON(res, 400, { ok: false, error: "正文不能为空" });

      const saved = await savePost({
        file,
        category,
        title,
        content,
        tags: cleanTags(payload.tags),
      });
      const deploy = await deployOrSkip(!shouldDeploy(payload));
      return sendJSON(res, deploy.ok ? 200 : 500, {
        ok: deploy.ok,
        saved: true,
        file: saved.file,
        permalink: saved.permalink,
        error: deploy.ok ? undefined : `部署失败（退出码 ${deploy.code}）`,
        deploy,
      });
    }

    if (pathname === "/api/posts/delete" && req.method === "POST") {
      const payload = await readJSON(req);
      const deleted = await deletePosts(payload.files);
      const deploy = await deployOrSkip(!shouldDeploy(payload));
      return sendJSON(res, deploy.ok ? 200 : 500, {
        ok: deploy.ok,
        deleted,
        error: deploy.ok ? undefined : `已删除 ${deleted.length} 篇，但部署失败（退出码 ${deploy.code}）`,
        deploy,
      });
    }

    if (pathname === "/api/shutdown" && req.method === "POST") {
      sendJSON(res, 200, { ok: true });
      setTimeout(() => process.exit(0), 120);
      return;
    }

    // —— 其余按构建产物预览
    const file = await resolveFile(PUBLIC_DIR, pathname.replace(/^\//, ""));
    if (file) return sendFile(res, file, "no-cache");

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  } catch (e) {
    const msg = String((e && e.message) || e);
    const status = (e && e.status) || 500;
    if (!res.headersSent) sendJSON(res, status, { ok: false, error: msg });
    else {
      try {
        res.destroy();
      } catch {
        /* ignore */
      }
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`写作台已启动 → http://${HOST}:${PORT}/publish`);
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(
      `端口 ${PORT} 已被占用：写作台可能已经在运行（直接打开 http://${HOST}:${PORT}/publish），` +
        `或者换个端口启动：PORT=4333 bun publish-server.mjs`
    );
  } else {
    console.error(`服务启动失败：${e.message}`);
  }
  process.exit(1);
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
