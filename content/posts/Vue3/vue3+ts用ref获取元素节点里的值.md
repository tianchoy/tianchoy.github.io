---
title: "vue3+ts用ref获取元素节点里的值"
date: 2024-10-20T11:42:58+08:00
categories: ["Vue3"]
draft: false
---



在vue2中获取元素节点的值：

```javascript
<div ref="myRef"></div>
this.$refs.myRef
```

在vue3+ts中获取元素节点的值

```javascript
<template>
    <div class="echarts-box">
        <div ref="box">111</div>
    </div>  
</template>
    
<script setup lang='ts'>
    import {ref,onMounted} from 'vue'

    const box:any = ref(null)
    onMounted(()=>{
    	console.log(box.value)//<div>111</div>
        console.log(box.value.innerText) //111
    })
</script>
```
记录一下