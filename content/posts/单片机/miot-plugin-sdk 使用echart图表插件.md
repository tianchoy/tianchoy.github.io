---
title: "miot-plugin-sdk 使用echart图表插件"
date: 2024-10-20T11:42:58+08:00
categories: ["单片机"]
tags: ["单片机"]
draft: false
---


## 1.安装 echart

```bash
npm install native-echarts --save
```

## 2.引用

```bash
import Echarts from 'native-echarts';
```

## 3.把option封装成函数

```bash
 echart(val,title){
    option = {
      tooltip: {
        formatter: '{a} <br/>{b} : {c}%'
      },
      series: [
        {
          name: 'Pressure',
          type: 'gauge',
          detail: {
            formatter: '{value}'
          },
          data: [
            {
              value: val,
              name: title
            }
          ]
        }
      ]
    };

    return option
  }
  
```

## 4.组件里调用

```bash
  <Echarts option={this.echart(this.start.title,this.state.val)} height={420} />
```

## 5.总结
在miot-plugin-sdk里面，如果不封装成函数，传不进去值，别的办法没去想，就这么用吧。组件里的高度和大小可以自己根据文档调试。
