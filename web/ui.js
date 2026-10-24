// 写作台共用的前端工具：请求封装、提示条、Markdown 预览渲染

(function () {
  const toastWrap = () => {
    let el = document.querySelector(".toast-wrap");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast-wrap";
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

  function initTopbar() {
    markActiveNav();
    const btn = document.getElementById("btnShutdown");
    if (btn) {
      btn.addEventListener("click", async () => {
        if (!confirm("关闭本地写作台服务？\n关闭后需要重新双击「写作台.app」才能继续发布。")) return;
        try {
          await fetch("/api/shutdown", { method: "POST" });
          toast("服务已关闭，可以关掉这个页面了");
          document.body.style.opacity = "0.55";
        } catch {
          toast("关闭失败，请手动结束进程", "err");
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
      valueEl.textContent = labelOf(cur) || "请选择…";
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
        b.innerHTML = `<span class="cs-opt-label"></span>${SVG_CHECK}`;
        b.firstChild.textContent = b.dataset.label || o.value;
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

  window.WB = { api, toast, renderMarkdown, countWords, esc, initTopbar, enhanceAllSelects };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceAllSelects);
  else enhanceAllSelects();
})();
