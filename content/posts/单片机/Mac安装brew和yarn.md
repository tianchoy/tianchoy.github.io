---
title: "Mac安装brew和yarn"
date: 2024-10-20T11:42:58+08:00
categories: ["单片机"]
tags: ["单片机"]
draft: false
---



1，通过镜像安装brew

```bash
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```

按回车后，根据提示操作：输入镜像序号 --> 输入Y，回车等待brew安装完成即可；
建议使用中科大的镜像。

2.安装yarn

```bash
curl -o- -L https://yarnpkg.com/install.sh | bash
```
个人体验下来，感觉yarn比npm方便，而且速度更快一些，还有一款pnpm速度也很快，仁者见仁的事情，请按照自己合适的选择来使用。
