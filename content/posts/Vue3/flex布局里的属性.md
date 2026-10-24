---
title: "flex布局里的属性"
date: 2024-10-20T11:42:58+08:00
categories: ["Vue3"]
tags: ["前端", "踩坑", "组件", "笔记", "Vue3"]
draft: false
---


1.   父级属性

     ```css
     flex-direction : 设置主轴的方向（row,row-reverse,column,column-reverse）
     	row：X轴从左至右（默认）【1,2,3  】
     	row-reverse：X轴从右至左【  3,2,1】
     	column：Y轴从上之下
     	column-reverse：Y轴从下至上
     	
     justify-content : 设置主轴上的子元素排列方式
     	flex-start :默认从头部开始，从左至右，X轴为主轴【1,2,3  】
     	flex-end : 从尾部开始排列【  1,2,3】
     	center： 在主轴居中对齐（主轴为X，则水平居中）【  1,2,3  】
     	space-around: 平分剩余空间【 1,  2,  3 】
     	space-between: 先两边贴边，再平分剩余空间【1,  2, 3, 4,  5】
     	
     flex-wrap : 设置元素是否换行
     	nowrap：默认不换行【1,2,3,4,5,6】
     	wrap：换行		   【1,2,3】
     					 【4,5,6】
     
     align-content : 设置侧轴上的子元素的排列放方式（多行）
     	flex-start:默认值在侧轴的头部开始排列
     	flex-end:在侧轴的尾部开始排列
     	center:在侧轴中间显示
     	space-around:子项在侧轴平分剩余空间
     	space-between:子项在侧轴先分布在两头，再平分剩余空间
     	stretch:设置子元素高度平分父元素高度
     	
     align-items : 设置侧轴上的子元素排列方式（单行）
     	center：垂直居中
     	flex-start：垂直居上
     	flex-end：垂直居下
     	stretch：拉伸
     	
     flex-flow : 复合属性，相当于同时设置了flex-direaction 和 flex-wrap
     	flex-flow: row wrap;
     ```

2.   子级属性

     ```css
     flex:1 子项所占的比例
     align-self: 控制子项自身在侧轴上的排列方式
     	flex-start:垂直居上
     	flex-end: 垂直居下
     	center: 居中
     order: 数值越小子项越靠前
     ```

     