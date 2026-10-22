---
title: "flutter- ListTile leading加载本地图标"
date: 2024-10-20T11:42:58+08:00
categories: ["dart"]
tags: ["dart"]
draft: false
---



```javascript
ListTile(
          leading: Images.assets('images/1.png'),
          title: Text('jquery 根据分类id分割数组'),
          subtitle: Text(
              '写项目的时候遇到一个问题'),
        )
```


现在改成这样就可以了：

```javascript
ListTile(
          leading: CircleAvatar(
            backgroundImage: AssetImage(
                "images/1.png"), // no matter how big it is, it won't overflow
          ),
          title: Text('jquery 根据分类id分割数组'),
          subtitle: Text(
              '写项目的时候遇到一个问题'),
        )
```
flutter学习中，加载本地图标，发现一个问题，原来的这种，vscode会报错，究其原因，是children: Widget[]中类型的问题，如果是Widget则没有这个问题，如果是const ，则会出现这个问题。记录一下。