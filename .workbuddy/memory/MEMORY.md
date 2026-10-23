# 项目长期记忆：blogData-main（本地目录名，GitHub 仓库已合并为 tianchoy.github.io）

- 技术栈：Hugo 静态博客，**主题 KeepIt**（vendored 于 `themes/keepit`，2026-10-22 由 hugo-coder 更换而来）。原 VitePress → hugo-coder → KeepIt 两次换肤均已落地。
- **单仓库 + GitHub Actions（2026-10-23 完成合并）**：源码与发布都在 `tianchoy/tianchoy.github.io` 仓库的 `main` 分支（根域名 `https://tianchoy.github.io/` 要求仓库必须叫这个名字）。旧的 `blogData-main` 仓库废弃可删。origin = `git@github.com:tianchoy/tianchoy.github.io.git`。`.github/workflows/deploy.yml`：push main 或手动触发 → Hugo 0.168.0 extended 构建 → deploy-pages。Pages Source 已设为 **GitHub Actions**。`public/` 被 .gitignore 忽略，不再提交。
- 内容组织：文章在 `content/posts/<分类>/<文章>.md`（注意是 **posts**），分类 Vue3/dart/python/react/单片机/diary；首页**只保留**头像 + 姓名 + 社交图标（无文章列表、无「乙火」），大段自我介绍在 `content/about.md`（`/about/`，导航「关于」）。
- 社交链接：GitHub `https://github.com/tianchoy`；饭否 `https://fanfou.com/tianchoy`；邮箱 `tianchoy@live.com`。**真实 GitHub 用户名是 tianchoy（不是 tianchao）**，写远程/推送时务必注意。
- 头像：`static/images/profile.jpg`（用户 me.jpg，150×150），`avatarURL = "/images/profile.jpg"`（**必须绝对路径**，否则 /about/ 下相对解析会破图）。关于页头图复用 `home/profile.html`，CSS 里圆形头像 + 隐藏 home-title/home-subtitle。
- 部署：`bash deploy.sh` = 本地 `hugo` 构建校验 + `git add/commit` + `git push origin main`（Actions 自动上线）。无需再手动推 public。
- 访问量统计：页脚「本站总访问量/访客数/本页阅读量」，用不蒜子 Busuanzi，靠 `[params.footer] custom`（hugo.toml）注入 script + span，未改主题模板。
- 站内一键发布：`publish-server.mjs`（Node 零依赖，绑 127.0.0.1:4321）。`node publish-server.mjs`（或 `npm run publish`）后访问 `/publish`：标题+内容+分类下拉（读 content/posts 全部分类）+发布按钮；点发布 → 在 `content/posts/<分类>/<标题>.md` 写带 frontmatter 文章 → 调 `bash deploy.sh`（推源码 → Actions 发布）。测试可加 `SKIP_DEPLOY=1` 跳过部署。
- 本地 Hugo 二进制：`/opt/homebrew/bin/hugo`（v0.168.0 extended，必须 extended 才能编译主题 SCSS）。brew 因沙箱/TCC 装不上，二进制为手动下载安装。
- 文章 frontmatter 约定：title / date / categories / draft（tags 字段保留但未启用标签页）。
- 自定义样式统一在 `assets/css/_custom.scss`（KeepIt `style.scss` 末尾 `@import "_custom"`），不直接改主题。列表标题 .95rem、详情正文 .92rem、`.archive-item` 加间距、`.post-info` 让「更新于」与分享图标同行左右分列。
- 关于页模板：`layouts/about.html`（root page 需放 `layouts/about.html`，不是 `layouts/page/`），`about.md` 加 `layout: "about"`。
