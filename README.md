# 特严赤傲 · 博客

基于 [Hugo](https://gohugo.io/) + liubai 主题（由 [KeepIt](https://github.com/Fastbyte01/KeepIt) 改名而来，vendored）的静态博客。
**源码与发布都在本仓库**（`tianchoy.github.io`），推送到 `main` 即由 GitHub Actions 自动构建并部署。

访问地址：https://tianchoy.github.io/

## 日常使用

### 写作台（推荐）

双击根目录的 **`写作台.app`** 即可：已在运行就打开浏览器，没运行就后台拉起服务再打开。

- `/publish` 写文章：左侧编辑 + 右侧实时预览，分类/标签、草稿自动存在本机、`⌘↵` 直接发布。
- `/manage` 文章管理：列出全部文章（标题/分类/日期/字数/大小），可搜索、按分类和草稿筛选、单篇或批量删除。
- `/admin` 站点设置：换头像、改站点名称与副标题、增删社交链接、切换访问统计，可「仅保存」或「保存并发布」。
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
| `themes/liubai/` | 主题（vendored，由 KeepIt 改名） |
| `assets/css/_custom.scss` | 自定义样式覆写 |
| `layouts/` | 模板覆写（about 页、页脚、统计 partial） |
| `写作台.app` | 可双击的本地写作台启动器 |
| `publish-server.mjs` | 写作台服务（页面 / API / 部署） |
| `web/` | 写作台前端页面（publish / manage / admin / 共用样式脚本） |
| `lib/site-config.mjs` | `hugo.toml` 与社交配置的读写 |
| `lib/posts.mjs` | 文章扫描、frontmatter 解析与删除 |

## 访问量统计

统计是**可切换**的，配置在 `hugo.toml` 的 `[params.analytics]`，由 `layouts/partials/stats.html` 按 `provider` 分支注入：

| provider | 说明 |
| --- | --- |
| `none` | 默认，不输出任何脚本 |
| `goatcounter` | 推荐。免费、脚本约 3 KB、无 Cookie，页脚可显示「本站浏览 / 本页阅读量」 |
| `umami` | 免费 10 万事件/月，来源/页面/设备/留存报表最完整 |
| `ga4` | Google Analytics 4，功能全但脚本重，国内访问常被拦 |
| `cloudflare` | 域名托管在 Cloudflare 时可用，免费无 Cookie，无页脚数字 |
| `busuanzi` | 旧方案，仅作兜底保留（见下） |

页面上也能改：`/admin` → 「访问统计」卡片，选服务、填 ID，保存即可。

启用 GoatCounter：注册 https://www.goatcounter.com/signup → 拿到子域名（如 `tianchoy`）→ 填到 `[params.analytics.goatcounter].site` → 在 GoatCounter 的 Settings 勾选 `Allow adding visitor counts on your website`（页脚数字依赖这个开关）。

> 不蒜子为什么弃用：它是按边缘节点/共享桶返回的，同一个域名实测能返回 `11013598` 和 `41` 两种结果，差 27 万倍；而且没有报表、没有来源数据、无法排查。数字看着好看，但不可信。

