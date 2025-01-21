### 1.编写ProductCount函数
```js
class ProductCount {
  public static getProductCount(count: number): string {
    if (count < 10) {
      return `当前数量: 0${count}`;
    }
    return `当前数量: ${count}`;
  }
}

export default ProductCount;
```
### 2.在代码文件中导入 `ProductCount` 类。

```js
import ProductCount from './ProductCount'; // 根据实际路径调整
```
### 3. 在 React 组件中使用**

在 React 项目中的组件中调用它并显示结果。

```js
render(): React.ReactNode {
        const formattedCount = ProductCount.getProductCount(this.state.count);
        return <>
            <h1>{formattedCount}</h1>
        </>
    }
```