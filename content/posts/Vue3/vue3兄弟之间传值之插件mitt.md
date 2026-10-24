---
title: "vue3兄弟之间传值之插件mitt"
date: 2024-10-20T11:42:58+08:00
categories: ["Vue3"]
tags: ["Vue3", "第三方库", "事件总线", "组件通信", "插件"]
draft: false
---


1.首先安装

```javascript
//npm
npm install mitt -S
//yarn
yarn add mitt -S
```
2.src下新建一个目录plugin,其中新建Bus.ts

```javascript
import mitt from 'mitt'

const mitter = mitt()

export default mitter
```

3.A组件

```javascript
<script setup lang='ts'>
import { ref } from 'vue-demi'
import Bus from '../plugin/Bus'
    const str = ref('text')
    const btn = ()=>{
        Bus.emit('btn',str)
    }
</script>
           
<template>
    <div>
        A组件
        {{str}}
        <button @click="btn">按钮</button>
    </div>
</template>
           
<style scoped lang='scss'>

</style>
```
4.B组件

```javascript
<script setup lang='ts'>
import {ref} from 'vue'
import { onBeforeMount } from 'vue-demi'
import Bus from '../plugin/Bus'
let s = ref('')
onBeforeMount(()=>{
    Bus.on('btn',(e:any)=>{
        s.value = e.value
        console.log( typeof e)
    })
})
</script>
           
<template>
    <div>
        B组件--{{s}}
    </div>
</template>
           
<style scoped lang='scss'>

</style>
```

记录一下。