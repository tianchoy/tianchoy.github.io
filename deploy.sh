#!/usr/bin/env sh

# 单仓库 + GitHub Actions 发布流程：
# 本地只做一次构建校验（输出到 public/，已被 .gitignore 忽略），
# 然后把源码提交并推送到 tianchoy.github.io 仓库，由 Actions 构建并发布。
set -e

# 本地构建校验，尽早发现模板/配置错误（public/ 不进入仓库）
hugo --gc --minify --cleanDestinationDir

# 提交并推送源码，触发 GitHub Actions 构建发布
git add -A
git diff --cached --quiet || git commit -m "blog update: $(date '+%Y-%m-%d %H:%M')"
git push origin main
