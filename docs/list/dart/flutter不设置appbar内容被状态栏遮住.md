# flutter不设置appbar内容被状态栏遮住


```dart
//1,引入dart:ui

import "dart:ui";

//2,获取头部状态栏高度

MediaQueryData.fromWindow(window).padding.top



//具体用法：

Padding(

padding:

EdgeInsets.only(top: MediaQueryData.fromWindow(window).padding.top)

)

```