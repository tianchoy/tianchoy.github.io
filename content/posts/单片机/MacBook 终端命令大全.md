---
title: "MacBook 终端命令大全"
date: 2025-08-17T09:08:29+08:00
categories: ["单片机"]
tags: ["Mac", "开发环境", "命令行", "教程", "Git"]
draft: false
---


MacBook 的终端(Terminal)是一个强大的工具，可以直接与 macOS 的 Unix 底层交互。以下是一些常用和实用的终端命令分类整理：

## 基本命令

1. **文件和目录操作**
   - `ls` - 列出目录内容
     - `ls -l` - 详细列表
     - `ls -a` - 显示隐藏文件
   - `cd` - 更改目录
     - `cd ~` - 返回家目录
     - `cd ..` - 返回上级目录
   - `pwd` - 显示当前工作目录
   - `mkdir` - 创建新目录
   - `rmdir` - 删除空目录
   - `rm` - 删除文件
     - `rm -r` - 递归删除目录及内容
   - `cp` - 复制文件/目录
   - `mv` - 移动/重命名文件
   - `touch` - 创建新文件或更新文件时间戳

2. **文件查看和编辑**
   - `cat` - 显示文件内容
   - `less` / `more` - 分页查看文件
   - `nano` - 简单文本编辑器
   - `vim` / `vi` - 高级文本编辑器
   - `open` - 用默认程序打开文件
     - `open .` - 在Finder中打开当前目录

## 系统信息

1. **系统信息**
   - `uname -a` - 显示系统信息
   - `system_profiler SPHardwareDataType` - 显示硬件信息
   - `top` - 显示运行中的进程(类似活动监视器)
   - `htop` - 更友好的进程查看器(需安装)
   - `df -h` - 显示磁盘空间使用情况
   - `du -sh *` - 显示当前目录各文件/文件夹大小
   - `sw_vers` - 显示macOS版本信息

2. **网络相关**
   - `ifconfig` - 显示网络接口信息
   - `ping` - 测试网络连接
   - `netstat` - 显示网络状态
   - `dig` - DNS查询工具
   - `nslookup` - 查询DNS记录
   - `ssh` - 远程登录
   - `scp` - 安全复制文件

## 进程管理

1. **进程控制**
   - `ps` - 显示当前进程
     - `ps aux` - 显示所有运行中的进程
   - `kill` - 终止进程
     - `kill -9 [PID]` - 强制终止进程
   - `killall` - 通过名称终止进程
   - `lsof` - 列出打开的文件和进程

## 用户和权限

1. **用户管理**
   - `whoami` - 显示当前用户名
   - `id` - 显示用户身份信息
   - `sudo` - 以超级用户权限执行命令
   - `passwd` - 更改密码
   - `dscl . -read /Users/[username]` - 查看用户信息

2. **权限管理**
   - `chmod` - 更改文件权限
   - `chown` - 更改文件所有者
   - `chgrp` - 更改文件所属组

## 实用工具

1. **搜索**
   - `find` - 查找文件
     - `find . -name "*.txt"` - 查找当前目录下所有txt文件
   - `grep` - 文本搜索
     - `grep "text" file.txt` - 在文件中搜索文本
   - `mdfind` - Spotlight搜索(快速)
     - `mdfind -name "filename"`

2. **压缩和解压**
   - `tar -czvf archive.tar.gz folder` - 创建gzip压缩文件
   - `tar -xzvf archive.tar.gz` - 解压gzip文件
   - `zip -r archive.zip folder` - 创建zip压缩文件
   - `unzip archive.zip` - 解压zip文件

3. **其他实用命令**
   - `say` - 文本转语音
   - `caffeinate` - 防止Mac进入睡眠
   - `pbcopy` - 复制到剪贴板
   - `pbpaste` - 从剪贴板粘贴
   - `defaults` - 修改系统默认设置
   - `brew` - Homebrew包管理器命令(需先安装)

## macOS特有命令

1. **系统管理**
   - `softwareupdate` - 系统更新工具
   - `spctl` - 管理Gatekeeper设置
   - `csrutil` - 管理系统完整性保护(SIP)
   - `nvram` - 查看/设置NVRAM变量
   - `diskutil` - 磁盘工具
   - `tmutil` - Time Machine工具

2. **网络配置**
   - `networksetup` - 网络设置工具
   - `airport` - Wi-Fi工具(通常位于/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport)

## 提示

1. 使用`man [command]`查看任何命令的手册页(如`man ls`)
2. 按Tab键可以自动补全命令和文件名
3. 使用`history`查看命令历史记录
4. 使用`!!`重复上一条命令
5. 使用`[command] --help`查看命令帮助(许多命令支持)

注意：使用终端命令时要小心，特别是使用`sudo`或删除命令时，错误的命令可能导致系统损坏或数据丢失。