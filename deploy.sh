#!/usr/bin/env sh

# 单仓库 + GitHub Actions 发布流程：
# 本地只做一次构建校验（输出到 public/，已被 .gitignore 忽略），
# 然后把源码提交并推送到 tianchoy.github.io 仓库，由 Actions 构建并发布。
set -e

# dart-sass：dartsass 编译需要 PATH 里有 `sass`（原生 Dart Sass 二进制）。
# 注意：rvm 也会提供一个 Ruby 包装版的 `sass`，会让 Hugo 的 dartsass 协议报
# "got unexpected EOF when executing sass"。所以无论 PATH 里是否已存在某个
# sass，都强制把 /opt/homebrew/bin 放在最前（那里的 sass 是指向 sass-embedded
# 原生二进制的符号链接 /opt/homebrew/bin/sass -> .../dart-sass/sass）。
export PATH="/opt/homebrew/bin:$PATH"

# 本地构建校验，尽早发现模板/配置错误（public/ 不进入仓库）
# 写作台是从 Finder 启动的，PATH 里可能没有 Homebrew，这里先确认 hugo 找得到
if ! command -v hugo >/dev/null 2>&1; then
  echo "找不到 hugo 命令：请确认已安装 extended 版，并在 PATH 里（/opt/homebrew/bin）" >&2
  exit 127
fi
hugo --gc --minify --cleanDestinationDir

# 提交并推送源码，触发 GitHub Actions 构建发布
git add -A

# 草稿（frontmatter 含 draft: true）属于没写完的私稿，不该进公开仓库。
# 这里只从「暂存区」移除（文件仍留在本地磁盘），既不会推上线，
# 也不会误删本地草稿；等哪天正式发布（draft:false）时再由下面的流程提交。
for f in $(git diff --cached --name-only -- 'content/posts/'); do
  [ -f "$f" ] || continue
  if head -15 "$f" | grep -qiE '^[[:space:]]*draft:[[:space:]]*true[[:space:]]*$'; then
    git reset -q HEAD -- "$f" >/dev/null 2>&1 || true
  fi
done

git diff --cached --quiet || git commit -m "blog update: $(date '+%Y-%m-%d %H:%M')"

# 推送到当前分支（不再写死 main，兼容分支重命名 / 多分支工作流）
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if ! git push origin "$BRANCH"; then
  echo "推送被拒，先同步远端再重试…" >&2
  if ! git pull --rebase --autostash origin "$BRANCH"; then
    # rebase 冲突时仓库会停在中间态，之后每次发布都会失败，先退干净再说
    git rebase --abort 2>/dev/null || true
    echo "同步远端失败（可能有冲突）：请手动运行 git pull --rebase origin $BRANCH 处理后再发布。" >&2
    exit 1
  fi
  git push origin "$BRANCH"
fi
