---
title: "python用pyinstaller打包exe,去掉黑窗口"
date: 2024-10-20T11:42:58+08:00
categories: ["python"]
tags: ["Python", "构建工具", "开发环境", "踩坑", "笔记"]
draft: false
---



使用Python编写程序将Python脚本打包成可执行文件（EXE）,但是会有一个命令框产生，很烦，所以，去掉这个框

1，安装pyinstaller

```bash
pip install pyinstaller
```
2，打包产生cmd命令框

```bash
pyinstaller --onefile main.py
```
3,去掉这个烦人的命令框，只需要多加一个参数 “--noconsole”

```bash
pyinstaller --onefile --noconsole main.py
```
就可以了。