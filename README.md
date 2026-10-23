# 特严赤傲 · 博客

基于 [Hugo](https://gohugo.io/) + [KeepIt](https://github.com/Fastbyte01/KeepIt) 的静态博客。
**源码与发布都在本仓库**（`tianchoy.github.io`），推送到 `main` 即由 GitHub Actions 自动构建并部署。

访问地址：https://tianchoy.github.io/

## 日常使用

### 写作台（推荐）

双击根目录的 **`写作台.app`** 即可：已在运行就打开浏览器，没运行就后台拉起服务再打开。

- `/publish` 写文章：左侧编辑 + 右侧实时预览，分类/标签、草稿自动存在本机、`⌘↵` 直接发布。
- `/admin` 站点设置：换头像、改站点名称与副标题、增删社交链接，可「仅保存」或「保存并发布」。
- 右上角「关闭服务」可停掉后台进程；也可以命令行 `bun run publish` 启动。

本地预览（含草稿）：

```bash
hugo server -D
```

一键发布（本地构建校验后推送源码，Actions 自动上线）：

```bash
bash deploy.sh
```

> 写作台调用 `deploy.sh` 部署，因此它需要 `git push` 可用。若走 HTTPS 被代理拦截，可把远程换成 SSH：
> `git remote set-url origin git@github.com:tianchoy/tianchoy.github.io.git`

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
| `写作台.app` | 可双击的本地写作台启动器 |
| `publish-server.mjs` | 写作台服务（页面 / API / 部署） |
| `web/` | 写作台前端页面（publish / admin / 共用样式脚本） |
| `lib/site-config.mjs` | `hugo.toml` 与社交配置的读写 |

## 访问量统计

页脚使用[不蒜子](https://busuanzi.ibruce.info/)统计：本站总访问量（PV）、访客数（UV）、本页阅读量。
