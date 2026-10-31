// Netlify 部署触发：评论服务端（netlify-starter）推到 GitHub 后**不会**自动构建，
// 必须手动 Trigger deploy。这里把这件事收进写作台，省得每次去后台点。
//
// 两种触发方式，二选一即可（都只存在本机 .deploy-auth.json，已加 .gitignore）：
//   1) Build Hook URL —— Netlify 后台一键生成的秘密地址，POST 一下就触发，最省事
//   2) Personal Access Token —— 走官方 API，除了触发还能回查部署状态
// 站点名直接从 hugo.toml 里的评论服务地址推导（*.netlify.app 的前缀），不用额外配置。

import { promises as fsp } from "node:fs";
import path from "node:path";
import { ROOT } from "./site-config.mjs";
import { walineServerURL } from "./comments.mjs";

const CONFIG_PATH = path.join(ROOT, ".deploy-auth.json");
const API = "https://api.netlify.com/api/v1";

export async function readDeployConfig() {
  try {
    const raw = JSON.parse(await fsp.readFile(CONFIG_PATH, "utf8"));
    return {
      buildHook: String(raw.buildHook || "").trim(),
      token: String(raw.token || "").trim(),
      clear: true,
    };
  } catch {
    return { buildHook: "", token: "", clear: true };
  }
}

export async function saveDeployConfig({ buildHook, token }) {
  const body = JSON.stringify(
    { buildHook: String(buildHook || "").trim(), token: String(token || "").trim() },
    null,
    2,
  );
  await fsp.writeFile(CONFIG_PATH, body, { mode: 0o600 });
}

// https://wondrous-chimera-eeddf5.netlify.app/.netlify/functions/comment → wondrous-chimera-eeddf5
export async function siteName() {
  const url = await walineServerURL();
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  const m = host.match(/^(.+?)\.netlify\.app$/);
  return m ? m[1] : "";
}

export async function deploysPageURL() {
  const name = await siteName();
  return name ? `https://app.netlify.com/sites/${name}/deploys` : "https://app.netlify.com/";
}

async function apiRequest(urlPath, token, options = {}) {
  const res = await fetch(`${API}${urlPath}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const msg = (payload && (payload.msg || payload.message)) || text.slice(0, 120) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return payload;
}

// 用站点名换 site id（官方 API 的按名筛选）
async function resolveSiteId(token) {
  const name = await siteName();
  if (!name) throw new Error("评论服务地址不是 *.netlify.app，没法推导站点");
  const sites = await apiRequest(`/sites?name=${encodeURIComponent(name)}`, token);
  const hit = Array.isArray(sites) ? sites.find((s) => s.name === name) : null;
  if (!hit) throw new Error(`没找到 Netlify 站点「${name}」，检查 token 权限`);
  return hit.id;
}

export async function triggerDeploy() {
  const cfg = await readDeployConfig();
  const name = await siteName();
  if (!cfg.buildHook && !cfg.token) {
    return { ok: false, error: "还没配置：至少要填 Build Hook URL 或 Personal Access Token" };
  }

  // 优先用 build hook：它是为触发而生的，不需要 token 权限
  if (cfg.buildHook) {
    const res = await fetch(cfg.buildHook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(30000),
    }).catch((e) => {
      throw new Error(`触发失败（${e.name === "TimeoutError" ? "超时" : "网络错误"}）`);
    });
    if (!res.ok) throw new Error(`Build Hook 返回 ${res.status}`);
    return { ok: true, via: "buildHook", site: name };
  }

  const id = await resolveSiteId(cfg.token);
  await apiRequest(`/sites/${id}/builds`, cfg.token, { method: "POST", body: "{}" });
  return { ok: true, via: "api", site: name };
}

export async function deployState() {
  const cfg = await readDeployConfig();
  if (!cfg.token) return { ok: false, error: "想看部署状态需要填 Personal Access Token" };
  const id = await resolveSiteId(cfg.token);
  const list = await apiRequest(`/sites/${id}/deploys?per_page=3`, cfg.token);
  const rows = (Array.isArray(list) ? list : []).map((d) => ({
    state: d.state,
    branch: d.branch,
    createdAt: d.created_at,
    publishedAt: d.published_at,
    error: d.error_message || "",
    id: d.id,
  }));
  return { ok: true, deploys: rows };
}
