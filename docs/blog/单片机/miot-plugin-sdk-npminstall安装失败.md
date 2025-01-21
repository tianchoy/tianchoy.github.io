# miot-plugin-sdk-npm install安装失败

最紧公司要开发一台智能设备，经过同事的对比，选中了米家作为云平台，于是，我就负责开发app界面端，根据官方文档教程
下载了miot-plugin-sdk 程序，准备开始开发,结果悲剧了……


## 遇到问题
 
   npm install 怎么也安装不成功，一直报错。我怀疑是不是我的npm出问题了呢？

   于是，使用 yarn 安装还是报错。。

   换成了cnpm 安装依旧不成功……

   折腾了一下午，百度了无数答案，始终没有找到好的解决办法。
   
   无奈，从头阅读文档，终于在官方的文档里找到原因了。

## 官方解答：
    
[说明](https://iot.mi.com/v2/new/doc/plugin/quickstart/quick-start)

    如果使用 npm 安装报错，可尝试 设置 npm 淘宝镜像 或使用搜索引擎搜索解决方案;

    如果还是没法安装，可以手动下载依赖：

2.1 删除项目 miot-plugin-sdk 根目录下的 node_modules 文件夹和 package-lock.json 文件;

2.2 访问 [此地址](https://kpan.mioffice.cn/webfolder/ext/En2oHYEhI6c%40) 下载 node_modules 依赖压缩包；

2.3 解压缩上面下载的 .zip 文件到项目 miot-plugin-sdk 根目录后
    
    再次执行 npm install 即可。

## 总结
    阅读官方文档很重要。



