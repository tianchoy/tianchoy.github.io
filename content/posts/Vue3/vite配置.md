---
title: "vite配置"
date: 2024-10-20T11:42:58+08:00
categories: ["Vue3"]
tags: ["Vue3"]
draft: false
---



vite配置项，有些需要记录一下

```javascript
import { defineConfig, Terser } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base:'./', //打包公共路径
  plugins: [vue()],
  build:{
    //打包环境移除console.log，debugger
    minify:'terser',
    terserOptions:{
      compress:{
        drop_console:true,
        drop_debugger:true
      }
    },
    //打包文件按照类型分文件夹显示
    rollupOptions:{
      output:{
        chunkFileNames:'js/[name]-[hash].js',
        entryFileNames:'js/[name]-[hash].js',
        assetFileNames:'[ext]/[name]-[hash].[ext]'
      }
    }
  },
  server:{
    proxy:{
      'api':{
        target:'csdn.net',
        changeOrigin:true,
        rewrite:(path)=> path.replace('/^\/api/','')
      },
    }
  }
})

```
记录一下第一部分。