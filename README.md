# 特严赤傲 · 博客

基于 [Hugo](https://gohugo.io/) + [KeepIt](https://github.com/Fastbyte01/KeepIt) 的静态博客。
**源码与发布都在本仓库**（`tianchoy.github.io`），推送到 `main` 即由 GitHub Actions 自动构建并部署。

访问地址：https://tianchoy.github.io/

## 日常使用

本地预览（含草稿）：

```bash
hugo server -D
```

一键发布（本地构建校验后推送源码，Actions 自动上线）：

```bash
bash deploy.sh
```

## 发布机制

- `.github/workflows/deploy.yml`：检出源码 → Hugo（0.168.0 extended）构建 → 上传并部署到 GitHub Pages。
- 仓库设置：`Settings → Pages → Build and deployment → Source = GitHub Actions`（一次性设置）。
- `public/` 为构建产物，已在 `.gitignore` 中忽略，无需提交。

## 目录

| 路径 | 说明 |
| --- | --- |
| `content/posts/` | 文章（按分类分目录） |
| `content/about.md` | 关于页 |
| `hugo.toml` | 站点配置（含导航、社交、页脚统计） |
| `themes/keepit/` | 主题（vendored） |
| `assets/css/_custom.scss` | 自定义样式覆写 |
| `layouts/` | 模板覆写（about 页等） |
| `publish-server.mjs` | 本地一键发布服务（`npm run publish`） |

## 访问量统计

页脚使用[不蒜子](https://busuanzi.ibruce.info/)统计：本站总访问量（PV）、访客数（UV）、本页阅读量。
