---
title: "whereType的作用"
date: 2026-05-21T21:04:00+08:00
categories: ["dart"]
tags: ["Dart", "泛型", "集合", "类型系统", "笔记"]
draft: false
---

`whereType<Marker>()` 是 Dart 中 Iterable 的一个方法，用于**过滤集合中指定类型的元素**。

## 它的作用

从集合中筛选出所有类型为 `<Marker>` 的元素，并返回一个新的 Iterable，忽略其他类型的元素。

## 在你的代码中

虽然你的 `map()` 函数明确返回了 `createNamedMarker()` 的结果（假定该方法返回 `Marker` 类型），但加上 `whereType<Marker>()` 可以起到**防御性编程**的作用：

- 如果 `createNamedMarker()` 在某些边界情况下返回了 `null` 或其他类型（比如错误处理时返回了 `Widget` 或其他对象），`whereType` 会安全地过滤掉这些非 `Marker` 的元素
- 确保最终传给地图的列表中**只包含有效的 Marker 对象**

## 示例对比

```dart
// 假设 createNamedMarker 可能返回 null
var items = [Marker('a'), null, Marker('b'), 'not a marker'];

// 不使用 whereType - 可能包含 null 或其他类型
items.map((e) => e).toList(); // [Marker, null, Marker, 'not a marker']

// 使用 whereType - 只保留 Marker 类型
items.whereType<Marker>().toList(); // [Marker, Marker]
```

## 是否必要？

如果 `createNamedMarker()` **保证永远返回非空的 Marker**，那么 `whereType` 是多余的。但考虑到你的 `deviceName` 可能为 null 等情况，保留它可以提高代码健壮性。