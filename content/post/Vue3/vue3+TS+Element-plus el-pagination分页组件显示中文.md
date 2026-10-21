---
title: "vue3+TS+Element-plus el-pagination分页组件显示中文"
date: 2024-10-20T11:42:58+08:00
categories: ["Vue3"]
draft: false
---


1，首先考虑改造一下main.ts

```javascript
// ! element-plus vue3.0
import element from 'element-plus'
import 'element-plus/lib/theme-chalk/index.css'
import locale from 'element-plus/lib/locale/lang/zh-cn' //中文
//在app中引用
app.use(ElementPlus,{locale})
```

如果得不到解决，那就单独在pagination的组件中解决一下

```html
<template>
      <el-config-provider :locale="locale">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage4"
        :page-sizes="[100, 200, 300, 400]"
        :page-size="100"
        layout="total, sizes, prev, pager, next, jumper"
        :total="400">
      </el-pagination>
    </el-config-provider>
</template>

<script lang='ts'>
import { reactive, ref, toRefs } from 'vue';
//引入vue方法
import { ElConfigProvider } from 'element-plus'
//中文包
import zhCn from "element-plus/lib/locale/lang/zh-cn"

export default({
    props:{
      pagReviewLength:Number
    },
    components: {
      [ElConfigProvider.name]: ElConfigProvider
    },
    setup(props:any,{emit}:any) {
      let locale = zhCn
      const state = reactive({
        pageSize:10,
        total:'',
        currentPage1:1
      })
  

      return {
        locale,
      };
    },
});
</script>

<style scoped>

</style>
```

把html中的el-pagination组件用

```javascript
<el-config-provider :locale="locale"></el-config-provider> 
```

包裹一下，应该能解决！

