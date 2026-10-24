---
title: "vue3自定义tab组件切换简易效果"
date: 2024-10-20T11:42:58+08:00
categories: ["Vue3"]
tags: ["Vue3", "组件", "Tab", "动态组件", "前端"]
draft: false
---



```javascript
<template>
        <div class="content">
            <div class="tab">
                <div @click="swichItem(item)" class="tabs-item" v-for="item in data" :key="item.name">{{item.name}}</div>
            </div>
            <component :is="current.comName"></component>
        </div>
</template>
    
<script setup lang='ts'>
import {reactive,markRaw} from 'vue'
import A from './components/A.vue'
import B from './components/B.vue'
import C from './components/C.vue'

    type Tabs = {
        name:string,
        comName: any
    }
    type Com = Pick<Tabs,'comName'>

    const data = reactive<Tabs[]>([
        {
            name:'我是a组件',
            comName: markRaw(A)
        },
        {
            name:'我是b组件',
            comName: markRaw(B)
        },
        {
            name:'我是C组件',
            comName: markRaw(C)
        }
    ])

    let current = reactive<Com>({
        comName:data[0].comName
    })

    const swichItem=(item:Tabs)=>{
        current.comName = item.comName
    }
</script>
    
<style scoped>
    .tabs-item{display: inline-block; width: 100px;border: 1px solid #ddd;text-align: center;}
</style>
```
其中ABC三个组件味各自tab里的内容。