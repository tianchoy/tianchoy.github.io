---
title: "vite中无法使用require和@无法使用的问题"
date: 2024-10-20T11:42:58+08:00
categories: ["Vue3"]
tags: ["Vue3"]
draft: false
---



1，安装插件

```javascript
//yarn 安装
yarn add -D vite-plugin-require-transform
//npm 安装
npm i vite-plugin-require-transform --S
```

2.在vite中配置一下即可

```javascript
import { defineConfig } from 'vite'
import requireTransform from 'vite-plugin-require-transform';
 
export default defineConfig({
  plugins: [
    requireTransform({
      fileRegex: /.ts$|.vue$/
    }),
  ],
});
```

vite里使用@需要在config里配置一下

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
const path = require('path');

export default defineConfig({
  plugins: [vue()],
  define: {
    'process.env': {},
  },
  resolve: {
    // 配置路径别名
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```
