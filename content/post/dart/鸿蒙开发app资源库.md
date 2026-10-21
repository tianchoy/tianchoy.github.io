---
title: "鸿蒙开发app资源库"
date: 2025-08-03T08:30:18+08:00
categories: ["dart"]
draft: false
---

### 鸿蒙图标库

[鸿蒙第三方插件库](https://ohpm.openharmony.cn/#/cn/home)

[鸿蒙图标库](https://developer.huawei.com/consumer/cn/design/harmonyos-symbol/)

#### 内置图标使用示例
```
// SymbolGlyph组件示例 

SymbolGlyph($r('sys.symbol.ohos_folder_badge_plus'))
  .fontSize(96)
  .fontColor(Color.Black)

// SymbolSpan嵌入文本示例

Text() {
  Span('通知 ')
  SymbolSpan($r('sys.symbol.bell_fill'))
}

示例中，ohos_folder_badge_plus和bell_fill均为示例，具体图标在鸿蒙图标库中找到

```

#### 传值方式

在`@ComponentV2`中传值方式与`@Component` 不同

`@ComponentV2`子组件中需用`@Param `当作修饰器，如果使用`@State`或者`@Prop `编辑器会报错