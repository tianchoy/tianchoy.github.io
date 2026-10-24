---
title: "vben admin pro 框架的 ApiComponent Api组件包装器select使用示例"
date: 2026-02-02T22:27:31+08:00
categories: ["Vue3"]
tags: ["Vue3", "组件", "教程", "前端", "构建工具"]
draft: false
---

最近开发的项目中，有一个功能是 form 表单里 select 组件下拉选项是通过接口返回的数据，我使用了ApiComponent 组件，实现这个功能有两种方法，第一种是通过 slots 插入组件的方式实现（参考：[vben admin pro 框架的BasicTable之 使用slots 插入组件](https://blog.csdn.net/tianchoy/article/details/157644035)），第二种就是下面这个。
废话不说，直接上代码。

```typescript
//1.在 data.ts 中引入接口和emitter文件
import { options } from '#/api/';
import { emitter } from '../mitt';
//2.在modalSchema中使用ApiSelect组件
export const modalSchema: FormSchemaGetter = () => [
  {
    label: 'label',
    fieldName: 'Id',
    component: 'ApiSelect',
    componentProps: {
      api: options,
      resultField: 'lists', //接口返回的数据列表
      labelField: 'Name', 
      valueField: 'id',
      onChange: (val:string) => {
        emitter.emit('handleChange', val);
      }
    },
  },
]
```
3. 需要注意的是，使用这个方法必须得用emitter把onChange时间传回主组件，所以还得创建一个emitter文件
```typescript
import { mitt } from '@vben/utils';

/**
 * dictType: string
 */
type Events = {
  handleChange: string;
};

export const emitter = mitt<Events>();
```
4.在主组件中编写接受切换的事件
```typescript
function handleChange(val: string) {
  console.log('选择的项', val);
}
emitter.on('handleChange', handleChange);
```
即可。