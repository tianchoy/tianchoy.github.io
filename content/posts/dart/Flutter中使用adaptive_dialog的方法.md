---
title: "Flutter中使用adaptive_dialog的方法"
date: 2025-06-26T22:02:15+08:00
categories: ["dart"]
tags: ["dart"]
draft: false
---


`adaptive_dialog`是一个强大的Flutter插件，它能够根据运行平台(iOS或Android)自动适配对话框样式，提供一致的用户体验。本教程将详细介绍如何使用这个插件。

## 1. 添加依赖

首先，在`pubspec.yaml`文件中添加`adaptive_dialog`依赖：

```yaml
dependencies:
  flutter:
    sdk: flutter
  adaptive_dialog: ^2.4.1  # 请检查最新版本
```

然后运行`flutter pub get`安装依赖。

## 2. 基本使用方法

### 2.1 导入包

```dart
import 'package:adaptive_dialog/adaptive_dialog.dart';
```

### 2.2 显示简单对话框

```dart
ElevatedButton(
  onPressed: () async {
    final result = await showOkAlertDialog(
      context: context,
      title: '提示',
      message: '这是一个自适应对话框示例',
    );
  },
  child: Text('显示对话框'),
)
```

## 3. 主要API功能

`adaptive_dialog`提供了多种便捷的API：

### 3.1 确认对话框(OK/Cancel)

```dart
final result = await showOkCancelAlertDialog(
  context: context,
  title: '确认操作',
  message: '你确定要执行此操作吗？',
  okLabel: '确定',
  cancelLabel: '取消',
);

if (result == OkCancelResult.ok) {
  print('用户确认');
} else {
  print('用户取消');
}
```

### 3.2 文本输入对话框

```dart
final result = await showTextInputDialog(
  context: context,
  title: '请输入',
  textFields: [
    DialogTextField(
      hintText: '用户名',
    ),
    DialogTextField(
      hintText: '密码',
      obscureText: true,
    ),
  ],
);
```

### 3.3 确认对话框(Confirmation)

```dart
final result = await showConfirmationDialog(
  context: context,
  title: '选择',
  message: '请选择一个选项',
  actions: [
    AlertDialogAction(
      key: 'option1',
      label: '选项1',
    ),
    AlertDialogAction(
      key: 'option2',
      label: '选项2',
    ),
  ],
);
```

### 3.4 模态操作表(Modal Action Sheet)

```dart
final result = await showModalActionSheet(
  context: context,
  title: '选择操作',
  message: '请选择要执行的操作',
  actions: [
    SheetAction(
      label: '编辑',
      key: 'edit',
    ),
    SheetAction(
      label: '删除',
      key: 'delete',
      isDestructiveAction: true,
    ),
  ],
);
```

## 4. 高级定制

### 4.1 自定义按钮样式

```dart
final result = await showOkCancelAlertDialog(
  context: context,
  title: '自定义样式',
  message: '这是一个自定义样式的对话框',
  okLabel: '确认',
  cancelLabel: '取消',
  style: AdaptiveStyle.adaptive,  // 自适应平台样式
  barrierDismissible: false,  // 点击外部不关闭
  actionsOverflowDirection: VerticalDirection.up,  // 操作按钮溢出方向
);
```

### 4.2 完全自定义对话框

```dart
final result = await showAdaptiveDialog(
  context: context,
  builder: (BuildContext context) {
    return AlertDialog.adaptive(
      title: Text('完全自定义'),
      content: Text('这是一个完全自定义的自适应对话框'),
      actions: [
        TextButton(
          child: Text('取消'),
          onPressed: () => Navigator.of(context).pop(false),
        ),
        TextButton(
          child: Text('确定'),
          onPressed: () => Navigator.of(context).pop(true),
        ),
      ],
    );
  },
);
```

## 5. 平台适配原理

`adaptive_dialog`会自动检测运行平台：
- 在iOS上使用`CupertinoAlertDialog`
- 在Android上使用`MaterialAlertDialog`

这种自动适配确保了应用在不同平台上都能提供原生的用户体验。

## 6. 注意事项

1. 确保Flutter版本在3.13或更高，因为`AlertDialog.adaptive`特性是3.13自带的
2. 对话框内容支持本地化
3. 对于复杂需求，可以使用标准APIs进行扩展

## 7. 完整示例

```dart
import 'package:flutter/material.dart';
import 'package:adaptive_dialog/adaptive_dialog.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Adaptive Dialog Demo',
      home: MyHomePage(),
    );
  }
}

class MyHomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Adaptive Dialog Demo'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              child: Text('显示确认对话框'),
              onPressed: () async {
                final result = await showOkCancelAlertDialog(
                  context: context,
                  title: '确认',
                  message: '你确定要执行此操作吗？',
                );
                print(result);
              },
            ),
            SizedBox(height: 20),
            ElevatedButton(
              child: Text('显示输入对话框'),
              onPressed: () async {
                final result = await showTextInputDialog(
                  context: context,
                  title: '登录',
                  textFields: [
                    DialogTextField(hintText: '用户名'),
                    DialogTextField(
                      hintText: '密码',
                      obscureText: true,
                    ),
                  ],
                );
                print(result);
              },
            ),
          ],
        ),
      ),
    );
  }
}
```
