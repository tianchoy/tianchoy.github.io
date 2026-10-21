---
title: "macOS查询安卓和ios模拟器列表"
date: 2025-06-28T20:53:38+08:00
categories: ["dart"]
draft: false
---

### macOS查询安卓和ios模拟器列表

```shell
# 安卓模拟器列表
cd ~/Library/Android/sdk/emulator
./emulator -list-avds

# 启动安卓模拟器
./emulator -avd 你的模拟器名称



# ios 模拟器列表
xcrun simctl list devices | grep -v unavailable

# 启动ios模拟器
open -a Simulator --args -CurrentDeviceUDID <设备标识符>
```
