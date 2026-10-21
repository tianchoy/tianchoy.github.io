#!/usr/bin/env sh

# 忽略错误
set -e

# 使用 Hugo 构建静态站点（输出到 public/）
hugo --gc --minify --cleanDestinationDir

# 进入待发布的目录
cd public

# 如果是发布到自定义域名
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# 部署到 https://<USERNAME>.github.io
git push -f git@github.com:tianchoy/tianchoy.github.io.git main

cd ..

git add -A
git diff --cached --quiet || git commit -m 'blog update'
git push -f git@github.com:tianchoy/blogData-main.git main
git push origin main
