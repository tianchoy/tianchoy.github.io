import{_ as s,o as n,c as a,R as i}from"./chunks/framework.o-1c6b6b.js";const u=JSON.parse('{"title":"flutter-firebase-login登陆失败","description":"","frontmatter":{},"headers":[],"relativePath":"list/dart/flutter-firebase-login登陆失败.md","filePath":"list/dart/flutter-firebase-login登陆失败.md","lastUpdated":1737441784000}'),e={name:"list/dart/flutter-firebase-login登陆失败.md"},l=i(`<h1 id="flutter-firebase-login登陆失败" tabindex="-1">flutter-firebase-login登陆失败 <a class="header-anchor" href="#flutter-firebase-login登陆失败" aria-label="Permalink to &quot;flutter-firebase-login登陆失败&quot;">​</a></h1><p>用flutter+firebase做推送功能的时候，根据firebase文档提示做，安装好 cli之后，怎么用科学上网都登陆不上去， 然后，在sf找到一些办法，试过之后，生效了。记录一下</p><div class="language-dart vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">dart</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//1.执行命令,不出意外会报错</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">firebase login</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//2.换一条</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">firebase login</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">ci</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//依旧报错</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//3.继续换</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">firebase login </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">--</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">no</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">localhost</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//还是不行。</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//由于科学上网无法代理全部的访问权限，所有，办法可以尝试：1.使用全局代理，继续运行上面的任一指令，若还是不行</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//2.则，从科学上网里复制一下代理命令 例如：export http_proxy=http://127.0.0.1:1087;export https_proxy=http://127.0.0.1:1087;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//3.打开终端(Mac)分别执行：</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">export</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> http_proxy=http:</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//127.0.0.1:1087</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">export https_proxy=http:</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">//127.0.0.1:1087</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">firebase login</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br></div></div><p>就完成了，继续根据文档提示走下去即可。</p><p>时间：2022-11-10</p>`,5),p=[l];function r(t,h,c,b,k,d){return n(),a("div",null,p)}const g=s(e,[["render",r]]);export{u as __pageData,g as default};
