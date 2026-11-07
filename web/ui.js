// 写作台共用的前端工具：请求封装、提示条、Markdown 预览渲染

(function () {
  const toastWrap = () => {
    let el = document.querySelector(".toast-wrap");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast-wrap";
      // 可访问性：让读屏软件把提示条当状态变更朗读出来（aria-live=polite）
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    return el;
  };

  function toast(message, kind = "", ms = 2600) {
    const el = document.createElement("div");
    el.className = "toast" + (kind ? " " + kind : "");
    el.textContent = message;
    toastWrap().appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .2s, transform .2s";
      el.style.opacity = "0";
      el.style.transform = "translateY(-4px)";
      setTimeout(() => el.remove(), 220);
    }, ms);
  }

  /* ---------- 统一模态弹窗（替代原生 confirm / prompt） ---------- */

  const SVG_ICON = {
    danger:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 22 20H2L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17" r="1.15" fill="currentColor"/></svg>',
    info:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="8" r="1.15" fill="currentColor"/></svg>',
  };

  // 返回 Promise：confirm 解析为 true(确定)/false(取消)，prompt 解析为 字符串(确定)/null(取消)
  //
  // 同时只允许一层弹窗「活着」响应键盘：两个框叠在一起时，Enter 会同时命中两份
  // keydown 处理器，等于一次回车点了两个确认（例如「放弃改动」和「关闭服务」）。
  // 这里用深度号判断，只有最上面那层才处理键盘和点遮罩。
  let modalDepth = 0;

  function openModal(opts) {
    const {
      title = "",
      bodyHTML = "",
      icon = "info",
      danger = false,
      input = false,
      placeholder = "",
      defaultValue = "",
      confirmText = "确定",
      cancelText = "取消",
    } = opts;

    return new Promise((resolve) => {
      let settled = false;
      const myDepth = ++modalDepth;
      const isTop = () => myDepth === modalDepth;
      const mask = document.createElement("div");
      mask.className = "wb-modal-mask";

      const modal = document.createElement("div");
      modal.className = "wb-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.innerHTML =
        `<div class="wb-modal-ico ${danger ? "ico-danger" : "ico-info"}">${SVG_ICON[icon] || SVG_ICON.info}</div>` +
        '<div class="wb-modal-main">' +
        `<h3 class="wb-modal-title">${esc(title)}</h3>` +
        bodyHTML +
        (input
          ? `<div class="wb-modal-field"><input class="wb-modal-input" type="text" placeholder="${esc(placeholder)}" value="${esc(defaultValue)}" autocomplete="off" spellcheck="false"></div>`
          : "") +
        '<div class="wb-modal-actions">' +
        `<button type="button" class="btn btn-ghost" data-act="cancel">${esc(cancelText)}</button>` +
        `<button type="button" class="btn ${danger ? "btn-danger" : "btn-primary"}" data-act="ok">${esc(confirmText)}</button>` +
        "</div></div>";
      mask.appendChild(modal);
      document.body.appendChild(mask);

      const inputEl = modal.querySelector(".wb-modal-input");
      const okBtn = modal.querySelector('[data-act="ok"]');
      const cancelBtn = modal.querySelector('[data-act="cancel"]');

      const finish = (val) => {
        if (settled) return;
        settled = true;
        if (myDepth === modalDepth) modalDepth = Math.max(0, modalDepth - 1);
        mask.classList.add("is-closing");
        document.removeEventListener("keydown", onKey, true);
        setTimeout(() => mask.remove(), 160);
        resolve(val);
      };

      const onKey = (e) => {
        if (!isTop()) return;
        if (e.key === "Escape") {
          e.preventDefault();
          finish(input ? null : false);
      } else if (e.key === "Enter" && !e.shiftKey && !(e.target instanceof HTMLTextAreaElement)) {
        // 体验项：Shift+Enter 不当作确认（常见于多行输入里换行），只有纯 Enter 才确认
        e.preventDefault();
        finish(input ? inputEl.value.trim() : true);
      } else if (e.key === "Tab") {
        // 可访问性：焦点困在弹窗内，Tab / Shift+Tab 在首尾之间循环，不会跑到背后页面
        const f = modal.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (f.length) {
          const first = f[0];
          const last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
      };

      okBtn.addEventListener("click", () => finish(input ? inputEl.value.trim() : true));
      cancelBtn.addEventListener("click", () => finish(input ? null : false));
      mask.addEventListener("click", (e) => {
        if (e.target === mask) finish(input ? null : false);
      });
      document.addEventListener("keydown", onKey, true);

      requestAnimationFrame(() => (input ? inputEl : okBtn).focus());
    });
  }

  function confirmDialog(opts = {}) {
    const { title = "", message = "", danger = false, confirmText = "确定", cancelText = "取消" } = opts;
    return openModal({
      title,
      bodyHTML: message ? `<div class="wb-modal-body">${esc(message)}</div>` : "",
      icon: danger ? "danger" : "info",
      danger,
      confirmText,
      cancelText,
    }).then((v) => v === true);
  }

  function promptDialog(opts = {}) {
    const { title = "", message = "", placeholder = "", defaultValue = "", confirmText = "确定", cancelText = "取消" } = opts;
    return openModal({
      title,
      bodyHTML: message ? `<div class="wb-modal-body">${esc(message)}</div>` : "",
      input: true,
      placeholder,
      defaultValue,
      confirmText,
      cancelText,
    });
  }

  async function api(url, options = {}) {
    let res;
    try {
      res = await fetch(url, options);
    } catch {
      // 服务被关掉、或端口被占时 fetch 直接抛 TypeError，原文只有 "Failed to fetch"
      throw new Error("连不上本地服务，可能已经关闭了（重新双击「写作台.app」即可）");
    }
    let data = null;
    try {
      data = await res.json();
    } catch {
      throw new Error(`服务返回了非 JSON 响应（HTTP ${res.status}）`);
    }
    if (!res.ok || data.ok === false) {
      const err = new Error(data && data.error ? data.error : `请求失败（HTTP ${res.status}）`);
      err.payload = data;
      throw err;
    }
    return data;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const CJK = /[\u4e00-\u9fa5\u3400-\u4dbf]/;

  function joinLines(buf) {
    if (!buf.length) return "";
    let s = buf[0];
    for (let i = 1; i < buf.length; i++) {
      const prev = s.slice(-1);
      const next = buf[i][0] || "";
      s += CJK.test(prev) && CJK.test(next) ? "" : "\n";
      s += buf[i];
    }
    return s;
  }

  function inline(text) {
    const codes = [];
    let s = String(text).replace(/`([^`\n]+)`/g, (m, c) => {
      codes.push(c);
      return "\u0000" + (codes.length - 1) + "\u0000";
    });

    s = esc(s);
    // 预览里的链接来自自己写的正文，仍然挡掉 javascript: —— 手滑粘进来一条就是一次点击执行
    const safeUrl = (u) => (/^\s*javascript:/i.test(u) ? "#" : u);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (m, alt, src, title) => {
      return `<img src="${safeUrl(src)}" alt="${alt}"${title ? ` title="${title}"` : ""}>`;
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (m, t, href, title) => {
      return `<a href="${safeUrl(href)}"${title ? ` title="${title}"` : ""} target="_blank" rel="noopener">${t}</a>`;
    });
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (m, p, u) => `${p}<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
    s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^_\w])_([^_\n]+)_/g, "$1<em>$2</em>");
    s = s.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
    s = s.replace(/\u0000(\d+)\u0000/g, (m, idx) => `<code>${esc(codes[Number(idx)])}</code>`);
    return s;
  }

  function splitRow(line) {
    return line
      .replace(/^\s*\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map((c) => c.trim());
  }

  function renderList(lines, start) {
    const first = lines[start].match(/^(\s*)([-*+]|\d+\.)\s+/);
    const baseIndent = first[1].length;
    const ordered = /\d/.test(first[2]);
    const items = [];
    let i = start;

    while (i < lines.length) {
      const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
      if (!m) break;
      const indent = m[1].length;
      if (indent < baseIndent) break;
      if (indent === baseIndent) {
        items.push({ text: m[3], children: [] });
        i++;
      } else {
        const sub = renderList(lines, i);
        if (items.length) items[items.length - 1].children.push(sub.html);
        i = sub.next;
      }
    }

    const tag = ordered ? "ol" : "ul";
    const html =
      `<${tag}>` +
      items.map((it) => `<li>${inline(it.text)}${it.children.join("")}</li>`).join("") +
      `</${tag}>`;
    return { html, next: i };
  }

  function renderMarkdown(src) {
    const lines = String(src || "").replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      const fence = line.match(/^```\s*([\w+-]*)\s*$/);
      if (fence) {
        const lang = fence[1];
        const buf = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++;
        out.push(
          `<pre><code${lang ? ` class="language-${lang}"` : ""}>${esc(buf.join("\n"))}</code></pre>`
        );
        continue;
      }

      if (!line.trim()) {
        i++;
        continue;
      }

      if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
        out.push("<hr>");
        i++;
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const lv = heading[1].length;
        out.push(`<h${lv}>${inline(heading[2].trim())}</h${lv}>`);
        i++;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        out.push(`<blockquote>${renderMarkdown(buf.join("\n"))}</blockquote>`);
        continue;
      }

      if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]*-{2,}[\s:|-]*\|?\s*$/.test(lines[i + 1])) {
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim() && /\|/.test(lines[i])) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        out.push(
          "<table><thead><tr>" +
            head.map((h) => `<th>${inline(h)}</th>`).join("") +
            "</tr></thead><tbody>" +
            rows.map((r) => "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>").join("") +
            "</tbody></table>"
        );
        continue;
      }

      if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
        const res = renderList(lines, i);
        out.push(res.html);
        i = res.next;
        continue;
      }

      if (/^\s*</.test(line)) {
        const buf = [];
        while (i < lines.length && lines[i].trim()) {
          buf.push(lines[i]);
          i++;
        }
        out.push(buf.join("\n"));
        continue;
      }

      const buf = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,6}\s|>\s?|```|\s*([-*+]|\d+\.)\s)/.test(lines[i]) &&
        !/^\s*([-*_])\s*(\1\s*){2,}$/.test(lines[i])
      ) {
        buf.push(lines[i]);
        i++;
      }
      if (!buf.length) {
        i++;
        continue;
      }
      out.push(`<p>${inline(joinLines(buf))}</p>`);
    }

    return out.join("\n");
  }

  // 中文按字、英文按词统计
  function countWords(text) {
    const s = String(text || "");
    const cjk = (s.match(/[\u4e00-\u9fa5\u3400-\u4dbf]/g) || []).length;
    const words = (s.match(/[A-Za-z0-9_]+(?:['-][A-Za-z0-9_]+)*/g) || []).length;
    return { chars: s.length, words: cjk + words };
  }

  function markActiveNav() {
    const here = location.pathname.replace(/\/$/, "") || "/publish";
    document.querySelectorAll(".nav-link[data-page]").forEach((a) => {
      if (a.getAttribute("href").replace(/\/$/, "") === here) a.classList.add("is-active");
    });
  }

  // 服务关掉后顶栏还挂着「本地服务运行中」会误导人，这里统一切成已停止的样子：
  // 状态点变灰、文案改成「服务已关闭」，正文变暗提示页面已经不能操作了。
  function markStopped(text) {
    const chip = document.querySelector(".status-chip");
    if (chip) {
      chip.textContent = text;
      chip.classList.add("is-off");
    }
    const btn = document.getElementById("btnShutdown");
    if (btn) {
      btn.textContent = "已关闭";
      btn.disabled = true;
    }
    document.body.classList.add("is-stopped");
  }

  // 服务真的还在，还是只是那一次请求断了？探一下 /api/ping 就知道
  async function stillAlive() {
    try {
      const res = await fetch("/api/ping", { cache: "no-store" });
      return res.ok;
    } catch {
      return false;
    }
  }

  function initTopbar() {
    markActiveNav();
    const btn = document.getElementById("btnShutdown");
    if (btn) {
      btn.addEventListener("click", async () => {
        if (!(await confirmDialog({ title: "关闭服务", message: "关闭本地写作台服务？\n关闭后需要重新双击「写作台.app」才能继续发布。", danger: true }))) return;
        btn.disabled = true;
        const old = btn.textContent;
        btn.textContent = "关闭中…";
        try {
          const res = await fetch("/api/shutdown", { method: "POST" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          markStopped("服务已关闭");
          toast("服务已关闭，可以关掉这个页面了");
        } catch {
          // 服务是在回完响应之后才退的，连接断开时 fetch 可能直接抛错 ——
          // 这时再用 /api/ping 探一次，探不通就说明确实已经关了。
          if (await stillAlive()) {
            btn.disabled = false;
            btn.textContent = old;
            toast("关闭失败，请手动结束进程", "err", 4200);
            return;
          }
          markStopped("服务已关闭");
          toast("服务已关闭，可以关掉这个页面了");
        }
      });
    }
  }

  /* ---------- 下拉框增强 ---------- */
  // 原生 <select> 在 macOS 上的弹层没法美化，这里换成「按钮 + 自绘列表」。
  // 值仍然放在原生 select 上，所以页面里 select.value = x、innerHTML 重建 option、
  // change / input 监听都不需要改一行代码。

  const SVG_CHEVRON =
    '<svg class="cs-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SVG_CHECK =
    '<svg class="cs-check" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.2 8.6 6.3 11.7 12.9 5.1" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // 同一时刻只允许一个下拉展开
  let openWrap = null;
  // 刚打开的那一下会伴随 scrollIntoView 之类的滚动，别把菜单自己关掉
  let openedAt = 0;

  function closeMenus(keep) {
    if (!openWrap || openWrap === keep) return;
    const wrap = openWrap;
    openWrap = null;
    wrap.classList.remove("is-open", "is-up");
    const menu = wrap.querySelector(".cs-menu");
    if (menu) menu.hidden = true;
    const trigger = wrap.querySelector(".cs-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  // 选项多于这个数就显示搜索框（例如站点设置里的 63 个社交平台）
  const SEARCH_THRESHOLD = 8;

  // 全局只挂一次：点空白处 / 页面滚动 / 窗口缩放时收起
  let dismissBound = false;
  function bindDismiss() {
    if (dismissBound) return;
    dismissBound = true;
    document.addEventListener("pointerdown", (e) => {
      if (openWrap && !openWrap.contains(e.target)) closeMenus();
    });
    document.addEventListener(
      "scroll",
      (e) => {
        if (!openWrap || performance.now() - openedAt < 250) return;
        if (!openWrap.contains(e.target)) closeMenus();
      },
      true
    );
    window.addEventListener("resize", () => closeMenus());
  }

  function enhanceSelect(select) {
    if (!select || select.dataset.csReady === "1") return;
    if (select.multiple || select.size > 1) return; // 多选 / 列表型不动
    select.dataset.csReady = "1";

    const wrap = document.createElement("div");
    wrap.className = "cs";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cs-trigger";
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.innerHTML = `<span class="cs-value"></span>${SVG_CHEVRON}`;

    const menu = document.createElement("div");
    menu.className = "cs-menu";
    menu.hidden = true;
    menu.setAttribute("role", "listbox");
    menu.innerHTML =
      '<div class="cs-search" hidden><input type="text" placeholder="搜索…" autocomplete="off" spellcheck="false"></div>' +
      '<div class="cs-list"></div>' +
      '<div class="cs-empty" hidden>没有匹配项</div>';

    const parent = select.parentNode;
    parent.insertBefore(wrap, select);
    wrap.appendChild(trigger);
    wrap.appendChild(menu);
    wrap.appendChild(select); // 原生控件留在原地承载状态，只做视觉隐藏
    select.classList.add("cs-native");
    select.tabIndex = -1;

    const valueEl = trigger.querySelector(".cs-value");
    const searchBox = menu.querySelector(".cs-search");
    const searchInput = searchBox.querySelector("input");
    const listEl = menu.querySelector(".cs-list");
    const emptyEl = menu.querySelector(".cs-empty");

    let active = 0;

    // 无障碍：借 label 的文案给触发按钮当名称
    if (select.id) {
      const lab = Array.from(document.getElementsByTagName("label")).find((l) => l.htmlFor === select.id);
      if (lab && lab.textContent.trim()) trigger.setAttribute("aria-label", lab.textContent.trim());
    }

    const labelOf = (o) => {
      if (!o) return "";
      return ((o.label || o.textContent || "").trim() || o.value || "").trim();
    };
    const visibleItems = () => Array.from(listEl.children).filter((el) => !el.hidden);

    function syncLabel() {
      const cur = select.options[select.selectedIndex];
      const ic = cur && cur.dataset.icon;
      const sv = cur && cur.dataset.svg;
      const col = cur && cur.dataset.color;
      valueEl.innerHTML =
        (sv ? `<span class="si"${col ? ` style="color:${col}"` : ""}>${sv}</span> ` :
          ic ? `<i class="${ic}"${col ? ` style="color:${col}"` : ""}></i> ` : "") +
        esc(labelOf(cur) || "请选择…");
      wrap.classList.toggle("is-empty", !select.value);
      for (const el of listEl.children) {
        // 空值不标选中：那是「请选择…」占位项，勾上会让人以为已经选好了
        const on = Boolean(select.value) && el.dataset.value === select.value;
        el.setAttribute("aria-selected", on ? "true" : "false");
      }
    }

    function applyFilter(focusFirst) {
      const q = searchInput.value.trim().toLowerCase();
      let shown = 0;
      for (const el of listEl.children) {
        const hit = !q || el.dataset.label.toLowerCase().includes(q);
        el.hidden = !hit;
        if (hit) shown++;
      }
      emptyEl.hidden = shown > 0;
      active = focusFirst ? 0 : -1;
      const vis = visibleItems();
      vis.forEach((el, i) => el.classList.toggle("is-active", i === active));
      return vis;
    }

    function rebuild() {
      listEl.textContent = "";
      for (const o of Array.from(select.options)) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cs-opt";
        b.setAttribute("role", "option");
        b.dataset.value = o.value;
        b.dataset.label = labelOf(o);
        b.disabled = o.disabled;
        const ic = o.dataset.icon;
        const sv = o.dataset.svg;
        const col = o.dataset.color;
        b.innerHTML =
          (sv ? `<span class="si"${col ? ` style="color:${col}"` : ""}>${sv}</span>` :
            ic ? `<i class="${ic}"${col ? ` style="color:${col}"` : ""}></i>` : "") +
          `<span class="cs-opt-label"></span>${SVG_CHECK}`;
        b.querySelector(".cs-opt-label").textContent = b.dataset.label || o.value;
        b.addEventListener("click", () => choose(b));
        listEl.appendChild(b);
      }
      searchBox.hidden = select.options.length <= SEARCH_THRESHOLD;
      syncLabel();
    }

    function moveActive(step) {
      const vis = visibleItems();
      if (!vis.length) return;
      if (active < 0) active = step > 0 ? 0 : vis.length - 1;
      else active = (active + step + vis.length) % vis.length;
      vis.forEach((el, i) => el.classList.toggle("is-active", i === active));
      const el = vis[active];
      // 只滚列表自身，避免把整页带着滚
      const top = el.offsetTop - listEl.offsetTop - (listEl.clientHeight - el.offsetHeight) / 2;
      listEl.scrollTop = Math.max(0, Math.min(top, listEl.scrollHeight - listEl.clientHeight));
    }

    function choose(el) {
      const before = select.value;
      select.value = el.dataset.value; // 走下面的 setter，标签自动同步
      closeMenus();
      trigger.focus({ preventScroll: true });
      if (select.value === before) return;
      // 原生 select 用户交互会先 input 再 change，这里照顺序补上
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function open() {
      // 体验项：已经展开时就别再重建（否则每次 ArrowDown 都会把高亮重置回当前项，
      // 导致从触发按钮连续按 ↓ 始终选不到第二项）。直接交给下面的 moveActive 继续移动。
      if (openWrap === wrap) return;
      closeMenus(wrap);
      openWrap = wrap;
      openedAt = performance.now();
      wrap.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      menu.hidden = false;
      searchInput.value = "";
      const vis = applyFilter(false);
      // 按可用空间决定弹出方向与最大高度，避免菜单贴到视口外
      const r = trigger.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < 200 && above > below;
      wrap.classList.toggle("is-up", up);
      menu.style.maxHeight = Math.max(140, Math.min(320, up ? above : below)) + "px";
      // 定位到当前选中项；还没选（值为空）就不高亮任何项
      const cur = select.value ? vis.findIndex((el) => el.dataset.value === select.value) : -1;
      if (cur >= 0) {
        active = cur;
        vis.forEach((el, i) => el.classList.toggle("is-active", i === cur));
        const el = vis[cur];
        listEl.scrollTop = Math.max(0, el.offsetTop - listEl.offsetTop - listEl.clientHeight / 2 + el.offsetHeight / 2);
      }
      // 大列表（社交平台）直接聚焦搜索框，省一次点击
      if (!searchBox.hidden && window.matchMedia("(pointer: fine)").matches) {
        searchInput.focus({ preventScroll: true });
      }
    }

    trigger.addEventListener("click", () => {
      if (openWrap === wrap) closeMenus();
      else open();
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        open();
        moveActive(e.key === "ArrowDown" ? 1 : -1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    menu.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenus();
        trigger.focus({ preventScroll: true });
      } else if (e.key === "Tab") {
        closeMenus();
      } else if (e.key === "Enter") {
        const vis = visibleItems();
        const el = vis[active >= 0 ? active : 0];
        if (el) {
          e.preventDefault();
          choose(el);
        }
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        moveActive(e.key === "ArrowDown" ? 1 : -1);
      }
    });

    searchInput.addEventListener("input", () => applyFilter(true));
    // 搜索框里的 Enter 交给 menu 的 keydown 统一处理（active 此时就是第一条命中项）

    // 页面里给 select.value / selectedIndex 赋值时同步显示文本
    const vDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    const iDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");
    Object.defineProperty(select, "value", {
      configurable: true,
      enumerable: true,
      get() {
        return vDesc.get.call(select);
      },
      set(v) {
        vDesc.set.call(select, v);
        syncLabel();
      },
    });
    Object.defineProperty(select, "selectedIndex", {
      configurable: true,
      enumerable: true,
      get() {
        return iDesc.get.call(select);
      },
      set(v) {
        iDesc.set.call(select, v);
        syncLabel();
      },
    });

    // 点 label 聚焦到原生控件时，把焦点转给可见的按钮
    select.addEventListener("focus", () => {
      if (document.activeElement === select) trigger.focus();
    });

    // option 被整体重建（分类/平台是异步拉取的）时跟着刷新
    new MutationObserver(() => rebuild()).observe(select, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["value", "label", "disabled"],
    });

    rebuild();
  }

  function enhanceAllSelects() {
    document.querySelectorAll("select").forEach(enhanceSelect);
    bindDismiss();
  }

  /* ---------- 页面加载指示 ---------- */
  // 图标的 markup 写在各页面 <body> 开头，首屏即可见；这里只负责「加载完」把它淡出。
  // 各页面在自己的初始化函数末尾调 WB.ready()（初始数据回来才算完，而不是只等 DOM），
  // 另有 8s 硬兜底：页面脚本抛错或接口卡住时也不能让转圈一直挂着。
  let loaderDone = false;
  const loaderStart = Date.now();

  function ready() {
    const el = document.getElementById("wbLoader");
    if (!el || loaderDone) return;
    loaderDone = true;
    // 本地接口常常几十毫秒就回，至少留 240ms，否则图标一闪而过反而像闪屏故障
    const wait = Math.max(0, 240 - (Date.now() - loaderStart));
    setTimeout(() => {
      el.classList.add("is-done");
      el.setAttribute("aria-hidden", "true");
      setTimeout(() => el.remove(), 260);
    }, wait);
  }

  setTimeout(ready, 8000);

  window.WB = { api, toast, renderMarkdown, countWords, esc, initTopbar, enhanceAllSelects, confirmDialog, promptDialog, ready };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceAllSelects);
  else enhanceAllSelects();
})();
