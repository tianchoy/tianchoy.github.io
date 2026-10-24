---
title: "GitHub 操作命令完整指南"
date: 2025-08-17T09:08:29+08:00
categories: ["单片机"]
tags: ["Git", "开发环境", "命令行", "教程", "前端"]
draft: false
---


## 基础配置

### 用户配置
```bash
# 设置全局用户名
git config --global user.name "Your Name"

# 设置全局邮箱
git config --global user.email "your.email@example.com"

# 查看当前配置
git config --list

# 设置默认编辑器（如VSCode）
git config --global core.editor "code --wait"
```

## 仓库操作

### 初始化与克隆
```bash
# 初始化本地仓库
git init

# 克隆远程仓库
git clone https://github.com/username/repository.git

# 克隆指定分支
git clone -b branch-name https://github.com/username/repository.git

# 添加远程仓库
git remote add origin https://github.com/username/repository.git

# 查看远程仓库信息
git remote -v
```

## 提交更改

### 基础操作
```bash
# 查看当前状态
git status

# 添加文件到暂存区
git add filename.txt
git add .                  # 添加所有更改
git add *.js               # 添加所有js文件

# 提交更改
git commit -m "描述信息"

# 修改上次提交
git commit --amend -m "新的提交信息"
```

### 查看提交历史
```bash
# 简洁查看提交历史
git log --oneline

# 图形化查看分支历史
git log --graph --oneline --all

# 查看指定文件的修改历史
git log -p filename

# 查看包含统计信息的提交历史
git log --stat

# 按作者查看提交
git log --author="username"

# 按时间范围查看
git log --since="2023-01-01" --until="2023-12-31"

# 查看某次提交的详情
git show commit-hash
```

## 分支管理

### 基础分支操作
```bash
# 查看分支
git branch       # 本地分支
git branch -a    # 所有分支(包括远程)
git branch -v    # 查看分支最后提交

# 创建分支
git branch new-feature

# 切换分支
git checkout main
git checkout -b hotfix    # 创建并切换分支

# 合并分支
git merge feature-branch

# 删除分支
git branch -d old-branch       # 安全删除(已合并)
git branch -D old-branch       # 强制删除(未合并)
```

### 远程分支操作
```bash
# 推送本地分支到远程
git push origin branch-name

# 跟踪远程分支
git checkout --track origin/branch-name

# 删除远程分支
git push origin --delete branch-name

# 获取远程分支列表
git ls-remote --heads origin
```

## 版本回滚与撤销

### 撤销工作区更改
```bash
# 撤销单个文件的修改
git checkout -- filename

# 撤销所有未暂存的修改
git checkout -- .

# 撤销所有修改(包括暂存的)
git reset --hard
```

### 回滚到特定版本
```bash
# 查看可回滚的提交历史(获取commit hash)
git log --oneline

# 软回滚(保留更改在工作区)
git reset --soft commit-hash

# 混合回滚(默认，保留更改在暂存区)
git reset commit-hash

# 硬回滚(彻底删除更改)
git reset --hard commit-hash

# 回滚到远程仓库状态
git reset --hard origin/main

# 回滚特定文件到某版本
git checkout commit-hash -- filename

# 创建回滚提交(适用于已推送的提交)
git revert commit-hash
```

### 恢复删除的分支
```bash
# 查找被删除分支的最后提交
git reflog

# 从reflog中恢复分支
git checkout -b recovered-branch commit-hash
```

## 远程同步

### 推送与拉取
```bash
# 推送本地分支到远程
git push origin branch-name

# 强制推送(谨慎使用)
git push -f origin branch-name

# 拉取远程更新
git pull origin branch-name

# 获取远程更新但不合并
git fetch origin

# 获取所有远程更新
git fetch --all
```

## 高级操作

### 储藏更改
```bash
# 储藏当前工作区
git stash

# 查看储藏列表
git stash list

# 恢复最近储藏
git stash pop

# 恢复指定储藏
git stash apply stash@{n}

# 删除储藏
git stash drop stash@{n}
```

### 标签管理
```bash
# 创建标签
git tag v1.0.0

# 创建带注释的标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 查看标签
git tag

# 推送标签到远程
git push origin v1.0.0
git push origin --tags    # 推送所有标签

# 删除标签
git tag -d v1.0.0
git push origin --delete v1.0.0
```

### 子模块
```bash
# 添加子模块
git submodule add https://github.com/username/repo.git

# 克隆包含子模块的仓库
git clone --recurse-submodules https://github.com/username/repo.git

# 更新子模块
git submodule update --init --recursive
```

## GitHub CLI (gh) 命令

```bash
# 登录GitHub账号
gh auth login

# 查看当前登录状态
gh auth status

# 创建PR
gh pr create

# 查看PR列表
gh pr list

# 合并PR
gh pr merge

# 克隆仓库
gh repo clone username/repository

# 创建新仓库
gh repo create
```

## 实用技巧

### 比较差异
```bash
# 比较工作区和暂存区
git diff

# 比较暂存区和最新提交
git diff --cached

# 比较两个分支
git diff branch1..branch2

# 比较特定文件在两个分支的差异
git diff branch1..branch2 -- filename
```

### 重写历史
```bash
# 交互式rebase(最近3次提交)
git rebase -i HEAD~3

# 修改提交作者信息
git commit --amend --reset-author

# 批量修改历史提交信息
git filter-branch -f --env-filter '
    OLD_EMAIL="old@email.com"
    NEW_NAME="New Name"
    NEW_EMAIL="new@email.com"
    if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]; then
        export GIT_COMMITTER_NAME="$NEW_NAME"
        export GIT_COMMITTER_EMAIL="$NEW_EMAIL"
    fi
    if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]; then
        export GIT_AUTHOR_NAME="$NEW_NAME"
        export GIT_AUTHOR_EMAIL="$NEW_EMAIL"
    fi
' --tag-name-filter cat -- --all
```

### 清理仓库
```bash
# 查看大文件
git rev-list --objects --all | grep "$(git verify-pack -v .git/objects/pack/*.idx | sort -k 3 -n | tail -5 | awk '{print$1}')"

# 清理历史大文件
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/large-file' --prune-empty --tag-name-filter cat -- --all

# 清理本地无效远程分支引用
git remote prune origin

# 垃圾回收
git gc --aggressive --prune=now
```

使用强制操作(如 `--force` push 或 `--hard` reset)时要格外小心，特别是在团队协作的项目中。