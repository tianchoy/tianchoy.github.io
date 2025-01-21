import{_ as a,o as e,c as t,R as n}from"./chunks/framework.o-1c6b6b.js";const u=JSON.parse('{"title":"miot-plugin-sdk-npm install安装失败","description":"","frontmatter":{},"headers":[],"relativePath":"blog/单片机/miot-plugin-sdk-npminstall安装失败.md","filePath":"blog/单片机/miot-plugin-sdk-npminstall安装失败.md","lastUpdated":null}'),l={name:"blog/单片机/miot-plugin-sdk-npminstall安装失败.md"},o=n(`<h1 id="miot-plugin-sdk-npm-install安装失败" tabindex="-1">miot-plugin-sdk-npm install安装失败 <a class="header-anchor" href="#miot-plugin-sdk-npm-install安装失败" aria-label="Permalink to &quot;miot-plugin-sdk-npm install安装失败&quot;">​</a></h1><p>最紧公司要开发一台智能设备，经过同事的对比，选中了米家作为云平台，于是，我就负责开发app界面端，根据官方文档教程 下载了miot-plugin-sdk 程序，准备开始开发,结果悲剧了……</p><h2 id="遇到问题" tabindex="-1">遇到问题 <a class="header-anchor" href="#遇到问题" aria-label="Permalink to &quot;遇到问题&quot;">​</a></h2><p>npm install 怎么也安装不成功，一直报错。我怀疑是不是我的npm出问题了呢？</p><p>于是，使用 yarn 安装还是报错。。</p><p>换成了cnpm 安装依旧不成功……</p><p>折腾了一下午，百度了无数答案，始终没有找到好的解决办法。</p><p>无奈，从头阅读文档，终于在官方的文档里找到原因了。</p><h2 id="官方解答" tabindex="-1">官方解答： <a class="header-anchor" href="#官方解答" aria-label="Permalink to &quot;官方解答：&quot;">​</a></h2><p><a href="https://iot.mi.com/v2/new/doc/plugin/quickstart/quick-start" target="_blank" rel="noreferrer">说明</a></p><pre><code>如果使用 npm 安装报错，可尝试 设置 npm 淘宝镜像 或使用搜索引擎搜索解决方案;

如果还是没法安装，可以手动下载依赖：
</code></pre><p>2.1 删除项目 miot-plugin-sdk 根目录下的 node_modules 文件夹和 package-lock.json 文件;</p><p>2.2 访问 <a href="https://kpan.mioffice.cn/webfolder/ext/En2oHYEhI6c%40" target="_blank" rel="noreferrer">此地址</a> 下载 node_modules 依赖压缩包；</p><p>2.3 解压缩上面下载的 .zip 文件到项目 miot-plugin-sdk 根目录后</p><pre><code>再次执行 npm install 即可。
</code></pre><h2 id="总结" tabindex="-1">总结 <a class="header-anchor" href="#总结" aria-label="Permalink to &quot;总结&quot;">​</a></h2><pre><code>阅读官方文档很重要。
</code></pre>`,17),i=[o];function p(r,s,d,m,c,_){return e(),t("div",null,i)}const k=a(l,[["render",p]]);export{u as __pageData,k as default};
