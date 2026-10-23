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
    const res = await fetch(url, options);
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
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (m, alt, src, title) => {
      return `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ""}>`;
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (m, t, href, title) => {
      return `<a href="${href}"${title ? ` title="${title}"` : ""} target="_blank" rel="noopener">${t}</a>`;
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

  window.WB = { api, toast, renderMarkdown, countWords, esc, initTopbar };
})();
