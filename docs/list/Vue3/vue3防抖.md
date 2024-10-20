# vue中防抖函数的使用


```javascript
//utils/debounce.js
//防抖函数
export const debounce = (() => {
    let timer = 0
    return (callback, wait) => {
        clearTimeout(timer)
        timer = setTimeout(callback,wait)
    }
})()
```
在实例中应用
```javascript
import { debounce } from "../utils/debounce";
debounce(() => {
//业务逻辑代码
},500)

```

记录一下。