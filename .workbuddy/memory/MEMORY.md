# 项目长期记忆：blogData-main

- 技术栈：Hugo 静态博客（主题 Anatole，vendored 于 themes/anatole）。原 VitePress 已于 2026-10-21 完全替换为 Hugo。
- 内容组织：文章在 `content/post/<分类>/<文章>.md`，分类为 Vue3/dart/python/react/单片机/diary；首页简介在 `content/_index.md`（简介+文章列表）。
- 构建/部署：`hugo --gc --minify` → `public/`；`deploy.sh` 推送 public 到 github.io、源码推到 blogData-main（git remote 不变）。
- 本地 Hugo 二进制：`/opt/homebrew/bin/hugo`（v0.168.0 extended）。brew 因沙箱/TCC 在该环境装不上，二进制为手动下载安装。
- 文章 frontmatter 约定：title / date / categories / draft。
