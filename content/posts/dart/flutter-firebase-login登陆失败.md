---
title: "flutter-firebase-login登陆失败"
date: 2024-10-20T11:42:58+08:00
categories: ["dart"]
tags: ["dart"]
draft: false
---



用flutter+firebase做推送功能的时候，根据firebase文档提示做，安装好 cli之后，怎么用科学上网都登陆不上去，
然后，在sf找到一些办法，试过之后，生效了。记录一下

```dart
//1.执行命令,不出意外会报错

firebase login

//2.换一条

firebase login:ci

//依旧报错

//3.继续换

firebase login --no-localhost

//还是不行。

//由于科学上网无法代理全部的访问权限，所有，办法可以尝试：1.使用全局代理，继续运行上面的任一指令，若还是不行

//2.则，从科学上网里复制一下代理命令 例如：export http_proxy=http://127.0.0.1:1087;export https_proxy=http://127.0.0.1:1087;

//3.打开终端(Mac)分别执行：
export http_proxy=http://127.0.0.1:1087

export https_proxy=http://127.0.0.1:1087

firebase login

```
就完成了，继续根据文档提示走下去即可。

时间：2022-11-10