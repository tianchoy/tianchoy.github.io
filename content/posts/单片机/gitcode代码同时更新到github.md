---
title: "gitcode代码同时更新到github"
date: 2026-05-23T22:09:11+08:00
categories: ["单片机"]
tags: ["单片机"]
draft: false
---

想把已在 GitCode 上的项目也同步到 GitHub，以后**只需一次 `git push` 就能同时更新两个平台**

### ⚙️ 本地 Git 配置多远程仓库（手动推送）
这种方法需要在电脑上操作，适合希望保留更多控制权、或不想配置令牌的场景。

**1. 准备工作（确保本地代码最新）**
首先，把你 GitCode 上的项目完整地拉到电脑本地：
```bash
git clone <你的GitCode项目地址>
cd <项目文件夹>
```

> **💡 关于认证方式的提示**
> 后续操作需要你有 GitHub 仓库的写入权限。
> *   **使用 HTTPS**：手动推送时可能会提示输入 GitHub 的用户名和密码（现需使用 Personal Access Token）。
> *   **使用 SSH**：若想更便捷，可参考文档为 GitHub 配置 SSH Key。

**2. 添加 GitHub 远程仓库地址**
在本地项目中，执行 `git remote add` 命令将 GitHub 仓库地址添加进来。名字可以用 `github` 以便区分。
```bash
git remote add github https://github.com/你的用户名/你的仓库名.git
```
(将上述地址替换为你实际的 GitHub 仓库地址)

**3. 验证是否添加成功**
```bash
git remote -v
```
如果看到类似下面的输出，说明已经准备好**两个远程地址**了：
```text
origin  https://gitcode.com/xxx/xxx.git (fetch)
origin  https://gitcode.com/xxx/xxx.git (push)
github  https://github.com/xxx/xxx.git (fetch)
github  https://github.com/xxx/xxx.git (push)
```

**4. 推送到 GitHub**
```bash
git push github main
```
如果默认分支是 `master`，命令里的 `main` 就改成 `master`。

### 🚀 进阶技巧：一次 push 同步两边
如果不想每次都分别对 `origin` 和 `github` 执行推送，可以修改 Git 配置，让 `git push` 命令一次同时推送到两个平台。
```bash
# 为 origin 远程仓库添加第二个 push 地址（即你的 GitHub 地址）
git remote set-url --add origin https://github.com/你的用户名/你的仓库名.git
```
配置完成后，以后在项目目录下直接运行 `git push`，代码就会同时推送到 GitCode 和 GitHub 了。

你是更倾向于在 GitCode 上设置自动同步，还是习惯在本地用 Git 命令手动操作？告诉我你的偏好，我可以帮你梳理对应的详细步骤。