# vue3中defineProps传值失去响应


写小项目的时候，遇到了一个问题，异步请求出的数据，无法及时传值给子组件，一时竟想不明白为什么，经过查阅资料，发现，子组件在用defineProps接受到值以后，必须用toRefs来解构一下，才可以。

父组件

```javascript
//父组件
<template>
    <Son :data="data"/>
</template>
<script setup>
import { ref } from "vue";
let data = ref('你哈')
</script>
```
子组件：

```javascript
<template>
    <div>{{ data }}</div>
</template>
<script setup>
import { toRefs } from "vue";
const props = defineProps({
  data: String,
});
//此处必须用toRefs，否则将失去响应式
const { data } = toRefs(props);
</script>
```
记录一下。