---
title: "Flutter 3.0.5 使用BottomNavigationBar数量超过3个时底部导航显示为白色"
date: 2024-10-20T11:42:58+08:00
categories: ["dart"]
tags: ["dart"]
draft: false
---


查询了源码之后，
得出当数量小于等于3时会默认fixed模式下使用主题色，
大于3时则会默认shifting模式下使用白色，
所以，type: BottomNavigationBarType.fixed,
即可.