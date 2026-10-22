# 项目长期记忆：blogData-main

- 技术栈：Hugo 静态博客，**主题 KeepIt**（vendored 于 `themes/keepit`，2026-10-22 由 hugo-coder 更换而来）。原 VitePress → hugo-coder → KeepIt 两次换肤均已落地。
- 内容组织：文章在 `content/posts/<分类>/<文章>.md`（注意是 **posts**），分类 Vue3/dart/python/react/单片机/diary；首页**只保留**头像 + 姓名 + 两行副标题 + 社交图标（不放介绍文案），大段自我介绍在 `content/about.md`（`/about/`，导航「关于」）。
- 主题定制（项目根 `layouts/` 覆写主题）：`layouts/_partials/home/social.html` 支持 `[[params.social]]` 的 `icon`（Font Awesome 类，如 `fa-brands fa-github fa-2x`）或 `svg`（读取 `assets/icons/<name>.svg` 并内联）。饭否无官方 FA 图标，用自定义 `assets/icons/fanfou.svg`。
- 社交链接：GitHub `https://github.com/tianchoy`；饭否 `https://fanfou.com/tianchoy`。**真实 GitHub 用户名是 tianchoy（不是 tianchao）**，写远程/推送时务必注意。
- 构建/部署：`hugo --gc --minify --cleanDestinationDir` → `public/`；`deploy.sh` 推送 public 到 `tianchoy.github.io`（main+master），源码推到 `tianchoy/blogData-main`。origin 用 SSH：`git@github.com:tianchoy/blogData-main.git`。
- 站内一键发布：`publish-server.mjs`（Node 零依赖，绑 127.0.0.1:4321）。`node publish-server.mjs`（或 `npm run publish`）后访问 `/publish`：标题+内容+分类下拉（读 content/posts 全部分类）+发布按钮；点发布 → 在 `content/posts/<分类>/<标题>.md` 写带 frontmatter 文章 → 调 `bash deploy.sh` 推 git。测试可加 `SKIP_DEPLOY=1` 跳过部署。
- 本地 Hugo 二进制：`/opt/homebrew/bin/hugo`（v0.168.0 extended，必须 extended 才能编译主题 SCSS）。brew 因沙箱/TCC 装不上，二进制为手动下载安装。
- 文章 frontmatter 约定：title / date / categories / draft。
- hugo-coder 关键配置：`params.author`（首页大标题）、`params.info`（副标题，可为数组）、`avatarURL`、`since`、`colorScheme`；`[pagination] pagerSize`；文章列表在 `/posts/`（`layouts/posts/list.html`）。
