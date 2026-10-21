---
title: "app端渐变背景"
date: 2026-09-03T21:48:35+08:00
categories: ["Vue3"]
draft: false
---

### uniappx 开发app端 页面背景渐变颜色
```js
  /* 对应从左到右的水平渐变 (90deg) */
  background-image: linear-gradient(to right, #E6F9E6, #E0F0FF);
```

### Web 上用于获取用户设备当前位置的核心方法
```js
// 获取用户设备当前位置
  navigator.geolocation.getCurrentPosition((position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log(`纬度: ${latitude}, 经度: ${longitude}`);
  });
```
