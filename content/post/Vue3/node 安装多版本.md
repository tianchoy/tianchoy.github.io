---
title: "node 安装多版本"
date: 2024-10-20T11:42:58+08:00
categories: ["Vue3"]
draft: false
---


首先安装n模块

```bash
 sudo npm install -g n
```

- 1、列出所有node版本

```bash
n ls
```

- 2、查看远程所有node

```bash
 n ls-remote
```

- 3、查看当前node版本

```bash
node -v
```

- 4、安装指定node版本

```bash
sudo n 14.17.0 
```

- 5、删除某个版本的node

```bash
sudo n rm 14.17.0 
```

- 6、安装最新稳定版

```bash
sudo n stable
```

- 7、安装最新版本

```bash
sudo n lastest
```

- 8、切换node版本(输入命令后上下键盘选择确认)

```bash
$ n
//若无法正常切换，则可以试试： sudo n
```

