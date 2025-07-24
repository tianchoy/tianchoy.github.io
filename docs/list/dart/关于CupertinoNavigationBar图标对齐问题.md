# 关于CupertinoNavigationBar图标对齐问题

开发一个自定义顶部栏，发现右侧图标与标题不在同一水平线上：

## 可能的原因

1. **CupertinoNavigationBar默认布局**：CupertinoNavigationBar的标题(middle)和尾部(trailing)控件默认可能有轻微的高度差异

2. **CupertinoButton的默认内边距**：您使用的CupertinoButton可能有默认的内边距影响对齐

3. **图标本身的设计**：CupertinoIcons中的图标可能有内置的视觉平衡空间

## 解决方案

### 方案1：调整CupertinoButton的padding

```dart
CupertinoButton(
  padding: EdgeInsets.zero,
  minSize: 0, 
  onPressed: onAddPressed,
  child: const Icon(CupertinoIcons.add),
)
```

### 方案2：使用IconButton代替CupertinoButton

```dart
IconButton(
  padding: EdgeInsets.zero,
  icon: const Icon(CupertinoIcons.add),
  onPressed: onAddPressed,
)
```

### 方案3：自定义对齐方式

```dart
Align(
  alignment: Alignment.center,
  child: Icon(CupertinoIcons.add),
)
```

### 方案4：检查父容器的约束

确保CupertinoNavigationBar没有被其他父容器添加了额外的padding或margin

## 完整修改后的_buildRightButton方法

```dart
Widget? _buildRightButton() {
  switch (rightButtonType) {
    case NavBarButtonType.add:
      return CupertinoButton(
        padding: EdgeInsets.zero,
        minSize: 0,
        onPressed: onAddPressed,
        child: const Icon(CupertinoIcons.add),
      );
    case NavBarButtonType.search:
      return CupertinoButton(
        padding: EdgeInsets.zero,
        minSize: 0,
        onPressed: onSearchPressed,
        child: const Icon(CupertinoIcons.search),
      );
    case NavBarButtonType.settings:
      return CupertinoButton(
        padding: EdgeInsets.zero,
        minSize: 0,
        onPressed: onSettingsPressed,
        child: const Icon(CupertinoIcons.settings),
      );
    case NavBarButtonType.none:
      return null;
  }
}
```
