import{_ as s,o as a,c as e,R as i}from"./chunks/framework.o-1c6b6b.js";const b=JSON.parse('{"title":"如何让ESP8266恢复出厂设置","description":"","frontmatter":{},"headers":[],"relativePath":"list/单片机/如何让ESP8266恢复出厂设置.md","filePath":"list/单片机/如何让ESP8266恢复出厂设置.md","lastUpdated":1729395778000}'),t={name:"list/单片机/如何让ESP8266恢复出厂设置.md"},n=i('<h1 id="如何让esp8266恢复出厂设置" tabindex="-1">如何让ESP8266恢复出厂设置 <a class="header-anchor" href="#如何让esp8266恢复出厂设置" aria-label="Permalink to &quot;如何让ESP8266恢复出厂设置&quot;">​</a></h1><p>1，安装python，2.7或者更高版本 2，运行：</p><div class="language-bash vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">get-pip.py</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br></div></div><p>3，运行：</p><div class="language-bash vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">pip</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> install</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> esptool</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br></div></div><p>4，运行的指令：</p><div class="language-bash vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">esptool.exe</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --port</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> COM3</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> erase_flash</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br></div></div><p>如果报错,就改成这样的命令试试：</p><div class="language-bash vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">esptool.py.exe</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --port</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> COM3</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> erase_flash</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br></div></div>',9),p=[n];function l(h,r,d,o,c,k){return a(),e("div",null,p)}const g=s(t,[["render",l]]);export{b as __pageData,g as default};
