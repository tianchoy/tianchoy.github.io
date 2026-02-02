需求：在BasicTable 列表中，插入一行Switch组件 改变状态的列
1，首先在主组件的 script 标签中引入 switch 组件

```javascript
import { Switch } from 'ant-design-vue'
```

2，在主组件的 html 中定义 template
```html
<BasicTable table-title="title">
      <template #status="{ row }">
        <Switch v-model:checked="row.status" />
      </template>
    </BasicTable>
```
3，在 data.ts 中插入

```javascript
export const columns: VxeGridProps['columns'] = [ 
{
    title: '状态',
    field: 'status',
    slots: { default: 'status' },
    minWidth: 160,
  }
];
```
即可。