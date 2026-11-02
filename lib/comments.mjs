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

// Netlify 函数包体 200MB+，冷启动偶尔会超时返回 502/504；这类瞬时失败重试一次就好，
// 而 4xx（参数错、鉴权错）重试也没用，直接抛。
const TIMEOUT_MS = 45000;
const RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504, 522, 524]);

async function request(url, options, { retries = 2 } = {}) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 800 * attempt));
    let res;
    try {
      res = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      // 网络错误 / 超时：只在重试次数内继续
      lastErr = new Error(`请求失败（${e.name === "TimeoutError" ? "超时" : "网络错误"}）`);
      continue;
    }
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
      if (RETRY_STATUS.has(res.status)) {
        lastErr = err;
        continue;
      }
      throw err;
    }
    if (payload && typeof payload.errno === "number" && payload.errno !== 0) {
      throw new Error(payload.errmsg || `接口 errno=${payload.errno}`);
    }
    return payload ? payload.data : null;
  }
  throw lastErr || new Error("请求失败");
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

export async function listComments({ status = "all", keyword = "", page = 1 } = {}) {
  // Waline 列表接口一次只认一个 status，所以「全部」是后端并行拉三种状态再合并。
  // 顺带每次都拉齐三种，这样任意视图的页脚都能显示真实的「待审核 / 垃圾」计数
  // （单状态列表响应里并不带跨状态的计数，旧版页脚永远显示 0/0）。
  const fetchOne = (st) => {
    const qs = new URLSearchParams({
      type: "list",
      owner: "all",
      status: st,
      keyword: String(keyword || ""),
      page: String(Number(page) || 1),
      lang: "zh-CN",
    });
    return authed("GET", `/api/comment?${qs.toString()}`);
  };

  // A6：原来这里用 .catch(() => ({})) 把三种状态的错误全吞掉，鉴权失败（401）也会被当成
  // 「暂无评论」——其实是拿不到数据。现在区分对待：401（凭证失效/非管理员）必须抛出去，
  // 让页面提示「鉴权失败」；只有瞬时网络/超时这类软错才退化为空，避免一次抖动就整页报错。
  const results = await Promise.all(
    ["approved", "waiting", "spam"].map((st) =>
      fetchOne(st).then(
        (data) => ({ ok: true, data }),
        (err) => ({ ok: false, error: err, status: err && err.status })
      )
    )
  );
  // 任一状态返回 401 即视为登录态已失效，优先抛出，别把空列表伪装成「没有评论」
  const authErr = results.find((r) => !r.ok && r.status === 401);
  if (authErr) throw authErr.error || new Error("评论后台鉴权失败，请重新登录管理员账号");
  // 非 401 的错误（网络/超时）退化为空数据，保证已有状态照常展示，而不是整页报错
  const [apR, waR, spR] = results;
  const ap = apR.ok ? apR.data : {};
  const wa = waR.ok ? waR.data : {};
  const sp = spR.ok ? spR.data : {};
  const pick = (o) => (o && Array.isArray(o.data) ? o.data : []);
  const totalOf = (o) => (o && typeof o.count === "number" ? o.count : pick(o).length);

  if (status && status !== "all") {
    const cur = { approved: ap, waiting: wa, spam: sp }[status] || {};
    return {
      data: pick(cur),
      totalPages: cur.totalPages || 1,
      spamCount: totalOf(sp),
      waitingCount: totalOf(wa),
    };
  }

  // 全部：待审核排最前（便于优先处理），其次已通过，最后垃圾
  const merged = [...pick(wa), ...pick(ap), ...pick(sp)];
  return {
    data: merged,
    totalPages: Math.max(ap.totalPages || 1, wa.totalPages || 1, sp.totalPages || 1),
    spamCount: totalOf(sp),
    waitingCount: totalOf(wa),
  };
}

export async function setCommentStatus(id, status) {
  return authed("PUT", `/api/comment/${encodeURIComponent(String(id))}`, { status });
}

export async function deleteComment(id) {
  return authed("DELETE", `/api/comment/${encodeURIComponent(String(id))}`);
}

// 解析 Waline 登录 token（标准 JWT）里的角色，作为校验管理员身份的兜底手段。
// 不依赖外部库——JWT 的 payload 只是 base64url 编码的 JSON，没有加密，
// 所以这里直接解出 role 看看是不是 admin。
function jwtRole(token) {
  try {
    const part = String(token).split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return json.role || null;
  } catch {
    return null;
  }
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
  if (!data || !data.token) return false;
  // A7：普通读者登录也有 token（只要注册过就能拿到），必须用 role 确认是管理员，
  // 否则一个读者账号也能被存进 .comments-auth.json、之后所有操作都 401 报「鉴权失败」。
  // Waline 的 /api/token 在 data.role（或嵌套 data.data.role）返回角色；
  // 万一版本不同拿不到，再用 JWT payload 兜底解一次。
  const role = data.role || (data.data && data.data.role) || jwtRole(data.token);
  if (role && role !== "admin") {
    throw new Error(`这个账号不是管理员（当前角色：${role}），无法管理评论`);
  }
  return true;
}
