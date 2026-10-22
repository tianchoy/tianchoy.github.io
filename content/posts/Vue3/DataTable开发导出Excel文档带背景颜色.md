---
title: "DataTable开发导出Excel文档带背景颜色"
date: 2024-10-20T11:42:58+08:00
categories: ["Vue3"]
tags: ["Vue3"]
draft: false
---



dataTable 导出Excel功能，要求在Excel文件里一行一行有背景颜色，整理了以下三种情况：

1，隔行变色

```javascript
$(document).ready(function() {

  $('#example').DataTable({
    dom: 'Bfrtip',
    buttons: [{
      extend: 'excelHtml5',
      customize: function ( xlsx ) {
        var sheet = xlsx.xl.worksheets['sheet1.xml'];
        $('row', sheet).each(function(x) {
          if(x %2 == 0){
            if ($('c[r=A'+x+'] t', sheet)) {
              $('row:nth-child('+x+') c', sheet).attr('s', '30');
            }
          }
      });
      }
    }]
  });
});
```
2，包含单元格某个特定字符串

```javascript
$(document).ready(function() {

  $('#example').DataTable({
    dom: 'Bfrtip',
    buttons: [{
      extend: 'excelHtml5',
      customize: function ( xlsx ) {
        var sheet = xlsx.xl.worksheets['sheet1.xml'];
 

        $('row', sheet).each(function(x) {
          if ($('c[r=C'+x+'] t', sheet).text().indexOf('Edin') !=-1) {
            $('row:nth-child('+x+') c', sheet).attr('s', '10');
          }
      });
      }
    }]
  });
});
```
3，特定行变色

```javascript
$(document).ready(function() {

  $('#example').DataTable({
    dom: 'Bfrtip',
    buttons: [{
      extend: 'excelHtml5',
      customize: function ( xlsx ) {
        var sheet = xlsx.xl.worksheets['sheet1.xml'];
 

        $('row', sheet).each(function(x) {
          if (x ==1 || x==2 || x==3) {
            $('row:nth-child('+x+') c', sheet).attr('s', '10');
          }
          else if(x ==7 || x==8 || x==9){
            $('row:nth-child('+x+') c', sheet).attr('s', '39');
          }
      });
      }
    }]
  });
});
```
