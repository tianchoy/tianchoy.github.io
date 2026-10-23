// 本地写作台服务（仅绑定 127.0.0.1）
//
// 页面：
//   /publish  发布文章
//   /admin    站点设置（头像 / 名称 / 副标题 / 社交链接）
//   /         预览构建后的站点（public/index.html）
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
import { listPosts, deletePosts } from "./lib/posts.mjs";

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
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("请求体过大"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
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
    .replace(/[\/\\:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "untitled";
}

function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}+08:00`
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

async function createPost({ category, title, content, tags }) {
  const slug = sanitizeFilename(title);
  const dir = path.join(CONTENT_DIR, category);
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

  const tagList = (tags || [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .map((t) => JSON.stringify(t))
    .join(", ");

  const fm =
    `---\ntitle: ${JSON.stringify(title)}\n` +
    `date: ${nowLocal()}\n` +
    `categories: [${JSON.stringify(category)}]\n` +
    (tagList ? `tags: [${tagList}]\n` : "") +
    `draft: false\n---\n\n${String(content).replace(/\s+$/, "")}\n`;

  await fsp.writeFile(file, fm, "utf-8");

  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  const permalink =
    "https://tianchoy.github.io/" +
    path
      .relative(path.join(ROOT, "content"), file)
      .split(path.sep)
      .join("/")
      .replace(/\.md$/, "") +
    "/";

  return { file: rel, permalink, absFile: file };
}

// ---------- 部署 ----------

function runDeploy() {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn("bash", ["deploy.sh"], {
      cwd: ROOT,
      env: PATH_ENV,
    });
    let out = "";
    const push = (d) => {
      out += d;
      if (out.length > 200000) out = out.slice(-100000);
    };
    child.stdout.on("data", push);
    child.stderr.on("data", push);
    child.on("error", (e) => resolve({ ok: false, code: -1, output: out + "\n" + e.message, ms: Date.now() - started }));
    child.on("close", (code) =>
      resolve({ ok: code === 0, code, output: out.slice(-8000), ms: Date.now() - started })
    );
  });
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
  const clean = decodeURIComponent(relPath);
  const target = path.normalize(path.join(baseDir, clean));
  if (!target.startsWith(baseDir)) return null;
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
      const deploy = await deployOrSkip(!payload.deploy);
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

    if (pathname === "/api/avatar" && req.method === "POST") {
      const type = req.headers["content-type"] || "";
      if (!avatarExtFor(type)) {
        return sendJSON(res, 400, { ok: false, error: "只支持 JPG / PNG / WebP / GIF" });
      }
      const buf = await readBody(req, 13 * 1024 * 1024);
      const { avatarURL, file } = await saveAvatarFile(buf, type);
      return sendJSON(res, 200, { ok: true, avatarURL, file });
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
        tags: Array.isArray(payload.tags) ? payload.tags : [],
      });
      const deploy = await deployOrSkip(Boolean(payload.dryRun));
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

    if (pathname === "/api/posts/delete" && req.method === "POST") {
      const payload = await readJSON(req);
      const deleted = await deletePosts(payload.files);
      const deploy = await deployOrSkip(!payload.deploy);
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
    if (!res.headersSent) sendJSON(res, 500, { ok: false, error: msg });
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

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
