// 本地发布服务（仅绑定 127.0.0.1）
// 提供站内发布页 /publish：标题 + 内容 + 分类下拉（读取全部分类）+ 发布按钮
// 点击发布 → 在 content/posts/<分类>/ 下生成 md → 运行 bash deploy.sh 推送 git
//
// 用法：node publish-server.mjs   （然后浏览器打开 http://127.0.0.1:4321/publish ）

import http from "node:http";
import nodeFs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const CONTENT_DIR = path.join(ROOT, "content", "posts");
const PORT = Number(process.env.PORT) || 4321;
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
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

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function readBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("请求体过大"));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

// 读取内容里所有分类：文件夹名 + frontmatter 中的 categories
async function readCategories() {
  const cats = new Set();
  try {
    const top = await fsp.readdir(CONTENT_DIR, { withFileTypes: true });
    for (const e of top) {
      if (e.isDirectory()) cats.add(e.name);
    }
  } catch {
    /* content/posts 可能不存在 */
  }
  // 递归扫描 frontmatter
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

function sanitizeFilename(name) {
  let s = name.trim().replace(/[\/\\:*?"<>|]/g, "").replace(/\s+/g, "-");
  s = s.replace(/^-+|-+$/g, "");
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

async function buildSiteAndDeploy() {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["deploy.sh"], {
      cwd: ROOT,
      env: process.env,
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("error", (e) => reject(e));
    child.on("close", (code) =>
      resolve({ code, output: out.slice(-4000) })
    );
  });
}

// ---------- 发布页 HTML ----------
function publishPageHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>发布文章 · 特严赤傲</title>
<style>
  :root { --bg:#f7f8fa; --card:#fff; --border:#e3e6ea; --text:#222; --muted:#888; --primary:#2d7ff9; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
         background:var(--bg); color:var(--text); }
  .wrap { max-width:760px; margin:32px auto; padding:0 16px; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:20px; box-shadow:0 2px 10px rgba(0,0,0,.04); }
  h1 { font-size:20px; margin:0 0 16px; }
  label { display:block; font-size:13px; color:var(--muted); margin:14px 0 6px; }
  input[type=text], select, textarea { width:100%; padding:10px 12px; border:1px solid var(--border);
         border-radius:8px; font-size:14px; font-family:inherit; background:#fff; color:var(--text); }
  textarea { min-height:320px; resize:vertical; font-family:"SFMono-Regular",Consolas,Menlo,monospace; line-height:1.6; }
  .row { display:flex; gap:10px; align-items:flex-end; }
  .row > div { flex:1; }
  button { cursor:pointer; border:none; border-radius:8px; font-size:14px; padding:10px 18px; }
  .btn-primary { background:var(--primary); color:#fff; }
  .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
  .btn-ghost { background:transparent; color:var(--muted); border:1px solid var(--border); }
  .status { margin-top:16px; padding:12px; border-radius:8px; font-size:13px; white-space:pre-wrap;
            background:#f0f4ff; border:1px solid #d6e4ff; display:none; }
  .status.ok { background:#eafaf0; border-color:#bfe9cf; }
  .status.err { background:#fdeeee; border-color:#f3c9c9; }
  .links { margin-top:10px; font-size:12px; }
  .links a { color:var(--primary); text-decoration:none; margin-right:12px; }
  .hint { font-size:12px; color:var(--muted); margin-top:4px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>发布新文章</h1>
    <div class="row">
      <div>
        <label>分类</label>
        <select id="category"><option>加载中…</option></select>
      </div>
      <div>
        <label>&nbsp;</label>
        <button class="btn-ghost" id="refresh">刷新分类</button>
      </div>
    </div>
    <div class="hint">分类读取自 content/posts 下的所有目录与文章 frontmatter。</div>

    <label>标题</label>
    <input type="text" id="title" placeholder="文章标题">

    <label>内容（支持 Markdown）</label>
    <textarea id="content" placeholder="# 小标题&#10;&#10;在这里写正文，支持 Markdown 语法…"></textarea>

    <div style="margin-top:18px; display:flex; gap:10px;">
      <button class="btn-primary" id="publish">发布</button>
    </div>

    <div class="status" id="status"></div>
    <div class="links">
      <a href="/" target="_blank">预览站点</a>
      <a href="/posts/" target="_blank">文章列表</a>
    </div>
  </div>
</div>
<script>
const $ = (id) => document.getElementById(id);
async function loadCategories() {
  const sel = $('category');
  sel.innerHTML = '<option>加载中…</option>';
  try {
    const r = await fetch('/api/categories');
    const data = await r.json();
    sel.innerHTML = '';
    if (!data.categories.length) {
      sel.innerHTML = '<option value="">（暂无分类）</option>';
    } else {
      for (const c of data.categories) {
        const o = document.createElement('option');
        o.value = c; o.textContent = c; sel.appendChild(o);
      }
    }
  } catch (e) {
    sel.innerHTML = '<option>读取失败</option>';
  }
}
function setStatus(msg, kind) {
  const s = $('status');
  s.style.display = 'block';
  s.className = 'status' + (kind ? ' ' + kind : '');
  s.textContent = msg;
}
$('refresh').onclick = loadCategories;
$('publish').onclick = async () => {
  const category = $('category').value;
  const title = $('title').value.trim();
  const content = $('content').value;
  if (!title) { setStatus('请填写标题', 'err'); return; }
  if (!content.trim()) { setStatus('请填写内容', 'err'); return; }
  const btn = $('publish');
  btn.disabled = true;
  setStatus('正在生成文章并运行 deploy.sh 推送 git，请稍候（约 30 秒）…');
  try {
    const r = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title, content }),
    });
    const data = await r.json();
    if (r.ok && data.ok) {
      setStatus('✅ 发布成功！\\n文件：' + data.file + '\\n线上：' + data.permalink + '\\n\\n' + data.deploy, 'ok');
    } else {
      setStatus('❌ 失败：' + (data.error || '未知错误') + '\\n\\n' + (data.deploy || ''), 'err');
    }
  } catch (e) {
    setStatus('❌ 请求出错：' + e.message, 'err');
  } finally {
    btn.disabled = false;
  }
};
loadCategories();
</script>
</body>
</html>`;
}

// ---------- 静态文件服务 ----------
async function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel === "/" || rel === "") rel = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  try {
    const stat = await fsp.stat(filePath);
    let target = filePath;
    if (stat.isDirectory()) {
      target = path.join(filePath, "index.html");
    }
    await fsp.access(target);
    pipeFile(res, target);
  } catch {
    res.writeHead(404);
    res.end("Not Found");
  }
}

function pipeFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  const s = nodeFs.createReadStream(filePath);
  s.on("error", () => {
    try {
      res.destroy();
    } catch {
      /* ignore */
    }
  });
  s.pipe(res);
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url || "/";
  try {
    if (urlPath === "/publish" || urlPath.startsWith("/publish?")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(publishPageHTML());
    }
    if (urlPath === "/api/categories") {
      const cats = await readCategories();
      return sendJSON(res, 200, { categories: cats });
    }
    if (urlPath === "/api/publish" && req.method === "POST") {
      const raw = await readBody(req);
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        return sendJSON(res, 400, { ok: false, error: "无效的 JSON" });
      }
      const { category, title, content } = payload || {};
      if (!category || !title || !content) {
        return sendJSON(res, 400, { ok: false, error: "分类、标题、内容均为必填" });
      }
      const slug = sanitizeFilename(title);
      const dir = path.join(CONTENT_DIR, category);
      await fsp.mkdir(dir, { recursive: true });
      let file = path.join(dir, slug + ".md");
      let n = 2;
      while (true) {
        try {
          await fsp.access(file);
          file = path.join(dir, `${slug}-${n}.md`);
          n++;
        } catch {
          break;
        }
      }
      const fm =
        `---\ntitle: ${JSON.stringify(title)}\n` +
        `date: ${nowLocal()}\n` +
        `categories: ["${category}"]\ndraft: false\n---\n\n${content}\n`;
      await fsp.writeFile(file, fm, "utf-8");

      const rel = path.relative(ROOT, file).split(path.sep).join("/");
      const contentRoot = path.join(ROOT, "content");
      const permalink =
        "https://tianchoy.github.io/" +
        path
          .relative(contentRoot, file)
          .replace(/\\/g, "/")
          .replace(/\.md$/, "") +
        "/";
      const deploy =
        process.env.SKIP_DEPLOY === "1"
          ? { code: 0, output: "(deploy 已跳过：SKIP_DEPLOY=1)" }
          : await buildSiteAndDeploy();
      if (deploy.code !== 0) {
        return sendJSON(res, 500, {
          ok: false,
          error: "deploy.sh 返回非零退出码 " + deploy.code,
          file: rel,
          permalink,
          deploy: deploy.output,
        });
      }
      return sendJSON(res, 200, {
        ok: true,
        file: rel,
        permalink,
        deploy: deploy.output,
      });
    }
    // 其余当作站点静态资源
    return serveStatic(req, res, urlPath);
  } catch (e) {
    return sendJSON(res, 500, { ok: false, error: String(e && e.message || e) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`发布服务已启动： http://${HOST}:${PORT}/publish`);
});
