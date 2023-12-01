import{_ as n,o as a,c as e,R as t}from"./chunks/framework.o-1c6b6b.js";const u=JSON.parse('{"title":"miot-plugin-sdk-npm install安装失败","description":"","frontmatter":{},"headers":[],"relativePath":"list/单片机/miot-plugin-sdk-npminstall安装失败.md","filePath":"list/单片机/miot-plugin-sdk-npminstall安装失败.md","lastUpdated":1701434627000}'),o={name:"list/单片机/miot-plugin-sdk-npminstall安装失败.md"},i=t(`<h1 id="miot-plugin-sdk-npm-install安装失败" tabindex="-1">miot-plugin-sdk-npm install安装失败 <a class="header-anchor" href="#miot-plugin-sdk-npm-install安装失败" aria-label="Permalink to &quot;miot-plugin-sdk-npm install安装失败&quot;">​</a></h1><p>最紧公司要开发一台智能设备，经过同事的对比，选中了米家作为云平台，于是，我就负责开发app界面端，根据官方文档教程 下载了miot-plugin-sdk 程序，准备开始开发……</p><h3 id="初始化" tabindex="-1">初始化 <a class="header-anchor" href="#初始化" aria-label="Permalink to &quot;初始化&quot;">​</a></h3><pre><code>1, 下载开发环境, 执行 
\`\`\`bash
git clone git@github.com:MiEcosystem/miot-plugin-sdk.git
\`\`\`
2, 命令行进入开发环境根目录, 安装 node 和 npm, 版本9.0+ 
( **推荐mac上：npm版本6.12.1，node版本v12.13.1** )
   内置一键安装开发环境脚本
   Windows: 执行 \`\`\`bash bin/install_mihome_dev.bat\`\`\` （注意按提示关闭实时安全防护)
   MacOS: 执行 \`\`\`bash bin/install_mihome_dev.sh\`\`\`

3, 安装ReactNative基础库, 在根目录下执行 npm install

!注意, 项目中如果需要使用第三方库(仅限于纯js实现), 请进入项目目录(如 projects/com.xiaomi.demo),
执行 npm install --save xxxx, 否则在打包发布时将因为找不到第三方库而失败
</code></pre><h3 id="命令" tabindex="-1">命令 <a class="header-anchor" href="#命令" aria-label="Permalink to &quot;命令&quot;">​</a></h3><pre><code>\`\`\`bash
//创建项目
npm run create xxx.yyy.zzz
    // 注: xxx.yyy.zzz 为项目路径名, 创建后项目位于projects/xxx.yyy.zzz下
也可以使用米家开发好的模板
npm run create xxx.xxx.xxx[插件包名] -type empty :    
npm run create xxx.xxx.xxx[插件包名] -type common : //创建一个通用模板项目(包括: 页面跳转（NavigationBar）、设置页（CommonSetting）、多语言、隐私、自定义场景、固件升级)    
npm run create xxx.xxx.xxx[插件包名] -type wifi :   //创建一个wifi模板项目(包括: 通用模板功能、设备控制及属性订阅功能)    
npm run create xxx.xxx.xxx[插件包名] -type ble :    // 创建一个ble模板项目(包括: 通用模板功能、蓝牙连接相关功能)    

启动调试
npm start xxx.yyy.zzz, //使用米家APP扫描控制台中的二维码开启调试。

运行Demo
在/miot-workspace下，执行
    npm install
如果windows 下 fsevents报错，可忽略。mac下，可执行npm install fsevents@latest。
其他报错，请查看issues，或者提工单。然后
    cd projects/com.xiaomi.demo
    npm install
然后就可以npm start，开始调试demo了

\`\`\`

**注意：之所以需要在com.xiaomi.demo下再执行一次npm install，
是因为我们在com.xiao.demo引入了纯js的第三方库：react-native-root-toast。
作为第三方库引入的示例！如果不执行npm install，直接调试com.xiaomi.demo会报错找不到react-native-root-toast！**

\`\`\`bash
// 发布项目
npm run publish xxx.yyy.zzz
//注: 缺省的目标文件位于 projects/xxx.yyy.zzz/build/publish.mpkg, 可以通过 --target 指定任意目标文件
\`\`\`
</code></pre><h3 id="配置" tabindex="-1">配置 <a class="header-anchor" href="#配置" aria-label="Permalink to &quot;配置&quot;">​</a></h3><p>在项目创建后(如xxx.yyy.zzz), 在projects/xxx.yyy.zzz 目录下有项目配置文件 project.json, 结构说明如下:</p><pre><code>{
    &quot;package_path&quot;:&quot;xxx.yyy.zzz&quot;,     //项目路径名
    &quot;min_sdk_api_level&quot;:10000        //支持运行的SDK API_LEVEL
}
</code></pre><h2 id="注意" tabindex="-1">注意 <a class="header-anchor" href="#注意" aria-label="Permalink to &quot;注意&quot;">​</a></h2><pre><code>1, 不允许对根目录下的 package.json 文件做任何修改,否则将导致在线打包失败,
2, 只允许在各自项目目录下(projects/xxx.yyy.zzz)引用第三方库, 
修改这下面的 package.json, 执行 npm install
3, 不允许引用 projects 下其他项目的任何内容
</code></pre><h2 id="遇到问题" tabindex="-1">遇到问题 <a class="header-anchor" href="#遇到问题" aria-label="Permalink to &quot;遇到问题&quot;">​</a></h2><p>npm install 怎么也安装不成功，一直报错。百度了无数答案，始终没有找到好的解决办法。于是，直接阅读文档，终于在官方的文档里找到原因了。</p><h2 id="官方解答" tabindex="-1">官方解答： <a class="header-anchor" href="#官方解答" aria-label="Permalink to &quot;官方解答：&quot;">​</a></h2><pre><code>\`[说明](https://iot.mi.com/v2/new/doc/plugin/quickstart/quick-start)\`
说明：

如果使用 npm 安装报错，可尝试 设置 npm 淘宝镜像 或使用搜索引擎搜索解决方案;

如果还是没法安装，可以手动下载依赖：

2.1 删除项目 miot-plugin-sdk 根目录下的 node_modules 文件夹和 package-lock.json 文件;

2.2 \`访问[此地址](https://kpan.mioffice.cn/webfolder/ext/En2oHYEhI6c%40)下载 node_modules 依赖压缩包；\`

2.3 解压缩上面下载的 .zip 文件到项目 miot-plugin-sdk 根目录后

再次执行 npm install 即可。
</code></pre><h2 id="总结" tabindex="-1">总结 <a class="header-anchor" href="#总结" aria-label="Permalink to &quot;总结&quot;">​</a></h2><pre><code>阅读官方文档很重要。
</code></pre>`,17),s=[i];function l(p,r,m,c,x,d){return a(),e("div",null,s)}const _=n(o,[["render",l]]);export{u as __pageData,_ as default};
