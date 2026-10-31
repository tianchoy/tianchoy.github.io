// 评论管理：写作台直接调 Waline 的管理接口，不用再单独开后台页面。
//
// 服务端地址从 hugo.toml 的 [params.page.comment.waline].serverURL 读；
// 管理员邮箱/密码**只**存在本机的 .comments-auth.json（已在 .gitignore 里），
// 绝不能写进 hugo.toml —— 那个文件会随站点发布到公开仓库，等于把后台密码公开。
//
// 接口约定（与 @waline/admin 一致）：
//   列表   GET  <serverURL>/api/comment?type=list&owner=all&status=…&keyword=…&page=…
//   改状态 PUT  <serverURL>/api/comment/<id>      body { status }
//   删除   DELETE <serverURL>/api/comment/<id>
//   登录   POST <serverURL>/api/token             body { email, password }
// 响应一律是 { errno, errmsg, data }，errno !== 0 视为失败。

import { promises as fsp } from "node:fs";
import path from "node:path";
import { ROOT, readToml, getValue } from "./site-config.mjs";

const AUTH_PATH = path.join(ROOT, ".comments-auth.json");

// token 只在进程内存里缓存，不落盘；收到 401 就重新登录一次
let tokenCache = null;

export async function readAuth() {
  try {
    const raw = JSON.parse(await fsp.readFile(AUTH_PATH, "utf8"));
    return { email: String(raw.email || ""), password: String(raw.password || "") };
  } catch {
    return { email: "", password: "" };
  }
}

export async function saveAuth(email, password) {
  const body = JSON.stringify({ email: String(email || ""), password: String(password || "") }, null, 2);
  await fsp.writeFile(AUTH_PATH, body, { mode: 0o600 });
  tokenCache = null;
}

export async function walineServerURL() {
  const text = await readToml();
  return String(getValue(text, "params.page.comment.waline", "serverURL") || "").trim().replace(/\/+$/, "");
}

async function request(url, options) {
  const res = await fetch(url, options);
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // 忽略：非 JSON 响应时下面用状态码兜底
  }
  if (!res.ok) {
    const msg = (payload && payload.errmsg) || `接口返回 ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (payload && typeof payload.errno === "number" && payload.errno !== 0) {
    throw new Error(payload.errmsg || `接口 errno=${payload.errno}`);
  }
  return payload ? payload.data : null;
}

async function getToken(base, auth, force) {
  if (!force && tokenCache) return tokenCache;
  const data = await request(`${base}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: auth.email, password: auth.password }),
  });
  if (!data || !data.token) throw new Error("登录成功但没拿到 token");
  tokenCache = data.token;
  return tokenCache;
}

// 统一入口：带上 Bearer token，401 时强制重登一次再试
async function authed(method, urlPath, body) {
  const base = await walineServerURL();
  if (!base) throw new Error("hugo.toml 里还没配置评论服务地址（params.page.comment.waline.serverURL）");
  const auth = await readAuth();
  if (!auth.email || !auth.password) throw new Error("还没有配置评论管理员账号");

  const url = `${base}${urlPath}`;
  // 注意：DELETE 没有请求体时不能带 Content-Type: application/json ——
  // 服务端的 think-payload 会去解析空字符串并抛 400「Incorrect parameter format」。
  const build = (token) => ({
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let token = await getToken(base, auth, false);
  try {
    return await request(url, build(token));
  } catch (e) {
    if (e.status !== 401) throw e;
    token = await getToken(base, auth, true);
    return await request(url, build(token));
  }
}

export async function listComments({ status = "approved", keyword = "", page = 1 } = {}) {
  const qs = new URLSearchParams({
    type: "list",
    owner: "all",
    status: String(status || "approved"),
    keyword: String(keyword || ""),
    page: String(Number(page) || 1),
    lang: "zh-CN",
  });
  return authed("GET", `/api/comment?${qs.toString()}`);
}

export async function setCommentStatus(id, status) {
  return authed("PUT", `/api/comment/${encodeURIComponent(String(id))}`, { status });
}

export async function deleteComment(id) {
  return authed("DELETE", `/api/comment/${encodeURIComponent(String(id))}`);
}

// 登录校验（保存凭证前先确认可用）
export async function verifyAuth(email, password) {
  const base = await walineServerURL();
  if (!base) throw new Error("hugo.toml 里还没配置评论服务地址");
  const data = await request(`${base}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: String(email || ""), password: String(password || "") }),
  });
  return !!(data && data.token);
}
