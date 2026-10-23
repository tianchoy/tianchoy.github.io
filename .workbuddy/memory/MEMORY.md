# 项目长期记忆：blogData-main（本地目录名，GitHub 仓库已合并为 tianchoy.github.io）

- 技术栈：Hugo 静态博客，**主题 KeepIt**（vendored 于 `themes/keepit`，2026-10-22 由 hugo-coder 更换而来）。原 VitePress → hugo-coder → KeepIt 两次换肤均已落地。
- **单仓库 + GitHub Actions（2026-10-23 完成合并）**：源码与发布都在 `tianchoy/tianchoy.github.io` 仓库的 `main` 分支（根域名 `https://tianchoy.github.io/` 要求仓库必须叫这个名字）。旧的 `blogData-main` 仓库废弃可删。origin = `git@github.com:tianchoy/tianchoy.github.io.git`。`.github/workflows/deploy.yml`：push main 或手动触发 → Hugo 0.168.0 extended 构建 → deploy-pages。Pages Source 已设为 **GitHub Actions**。`public/` 被 .gitignore 忽略，不再提交。
- 内容组织：文章在 `content/posts/<分类>/<文章>.md`（注意是 **posts**），分类 Vue3/dart/python/react/单片机/diary；首页**只保留**头像 + 姓名 + 社交图标（无文章列表、无「乙火」），大段自我介绍在 `content/about.md`（`/about/`，导航「关于」）。
- 社交链接：GitHub `https://github.com/tianchoy`；饭否 `https://fanfou.com/tianchoy`；邮箱 `tianchoy@live.com`。**真实 GitHub 用户名是 tianchoy（不是 tianchao）**，写远程/推送时务必注意。
- 头像：`static/images/profile.jpg`（用户 me.jpg，150×150），`avatarURL = "/images/profile.jpg"`（**必须绝对路径**，否则 /about/ 下相对解析会破图）。关于页头图复用 `home/profile.html`，CSS 里圆形头像 + 隐藏 home-title/home-subtitle。
- 部署：`bash deploy.sh` = 本地 `hugo` 构建校验 + `git add/commit` + `git push origin main`（Actions 自动上线）。无需再手动推 public。
- 访问量统计：页脚「本站总访问量/访客数/本页阅读量」，用不蒜子 Busuanzi，靠 `[params.footer] custom`（hugo.toml）注入 script + span，未改主题模板。
- 写作台（本地发布）：双击根目录 **`写作台.app`**（macOS shell-script bundle，launcher 里补 `/opt/homebrew/bin`、`~/.bun/bin` 到 PATH，因为 Finder 启动不带这些）→ 已有服务就直接开浏览器，没有就 `bun`（缺则 node）后台起 `publish-server.mjs`（绑 127.0.0.1:4321）。页面 `/publish` 写文章、`/admin` 站点设置、`/` 预览构建产物。服务端 `publish-server.mjs` + `lib/site-config.mjs`（hugo.toml 定点改写：按段名+键替换，不整体 parse，保证注释与顺序不丢；站点名同时写 title/params.title/header.name/home.profile.title）+ `web/`（publish/admin/ui.css/ui.js，经 `/ui/*` 提供）。头像 `POST /api/avatar` 写 `static/images/profile.<ext>`（sips 仅 >512px 才缩，URL 带 `?v=`）。测试可 `SKIP_DEPLOY=1` 或发布页勾「仅存本地」。日志 `.writing-desk.log`（已忽略）。
- **git remote 用 SSH**（`git@github.com:tianchoy/tianchoy.github.io.git`）：HTTPS 走代理会 502，`deploy.sh` 的 `git push origin main` 必须走 SSH，否则界面发布必失败。
- 本地 Hugo 二进制：`/opt/homebrew/bin/hugo`（v0.168.0 extended，必须 extended 才能编译主题 SCSS）。brew 因沙箱/TCC 装不上，二进制为手动下载安装。
- 文章 frontmatter 约定：title / date / categories / draft（tags 字段保留但未启用标签页）。
- 自定义样式统一在 `assets/css/_custom.scss`（KeepIt `style.scss` 末尾 `@import "_custom"`），不直接改主题。列表标题 .95rem、详情正文 .92rem、`.archive-item` 加间距、`.post-info` 让「更新于」与分享图标同行左右分列。
- 关于页模板：`layouts/about.html`（root page 需放 `layouts/about.html`，不是 `layouts/page/`），`about.md` 加 `layout: "about"`。
- 站内搜索：KeepIt lunr + 构建产物 `/index.json`（`[outputs] home` 含 JSON）。中文分词由站点 `assets/lib/lunr/lunr.segmentit.js`（5KB）同名覆盖主题 3.79MB 词典实现：bigram+单字切分、`lunr.queryHandler` 加 `+` 全命中、重写 `lunr.zh` 对齐 searchPipeline、包装 `window.autocomplete` 给 suggestion 模板补 `{query}`。lunr/autocomplete 已本地化（`assets/data/cdn/jsdelivr.yml` 注掉对应 CDN 项）。`[params.search]` 在 hugo.toml 显式声明。部署时 HTTPS 推送会被代理 502，用 `git push git@github.com:tianchoy/tianchoy.github.io.git main`。
