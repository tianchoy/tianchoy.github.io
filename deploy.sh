#!/usr/bin/env sh

# 单仓库 + GitHub Actions 发布流程：
# 本地只做一次构建校验（输出到 public/，已被 .gitignore 忽略），
# 然后把源码提交并推送到 tianchoy.github.io 仓库，由 Actions 构建并发布。
set -e

# dart-sass：dartsass 编译需要 PATH 里有 `sass`（原生 Dart Sass 二进制，不是 npm 的 JS 包装版）。
# 终端双击/精简 PATH 时可能没有 Homebrew，这里补上（/opt/homebrew/bin/sass 指向原生 dart-sass）。
if ! command -v sass >/dev/null 2>&1; then
  PATH="/opt/homebrew/bin:$PATH"
  export PATH
fi

# 本地构建校验，尽早发现模板/配置错误（public/ 不进入仓库）
# 写作台是从 Finder 启动的，PATH 里可能没有 Homebrew，这里先确认 hugo 找得到
if ! command -v hugo >/dev/null 2>&1; then
  echo "找不到 hugo 命令：请确认已安装 extended 版，并在 PATH 里（/opt/homebrew/bin）" >&2
  exit 127
fi
hugo --gc --minify --cleanDestinationDir

# 提交并推送源码，触发 GitHub Actions 构建发布
git add -A
git diff --cached --quiet || git commit -m "blog update: $(date '+%Y-%m-%d %H:%M')"

# 在 GitHub 网页上直接改过文件时，本地会落后一个提交导致 push 被拒；
# 自动 rebase 再推一次，省得回来手动处理
if ! git push origin main; then
  echo "推送被拒，先同步远端再重试…" >&2
  if ! git pull --rebase --autostash origin main; then
    # rebase 冲突时仓库会停在中间态，之后每次发布都会失败，先退干净再说
    git rebase --abort 2>/dev/null || true
    echo "同步远端失败（可能有冲突）：请手动运行 git pull --rebase origin main 处理后再发布。" >&2
    exit 1
  fi
  git push origin main
fi
