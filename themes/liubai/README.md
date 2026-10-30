# LiuBai（留白）| Hugo 主题

**LiuBai（留白）** 是一个为 [Hugo](https://gohugo.io/) 打造的**简洁、优雅**的博客主题。

「留白」是中国传统书画与设计中“计白当黑”的审美——画面中不着笔墨之处，反而让内容呼吸、让重点显现。本主题以此为名，追求极简、和谐、精致的视觉，让文字本身成为主角，去掉一切多余的装饰与噪音。

## 设计理念

- **留白即设计**：以充足的间距、克制的色彩与清晰的层级，让阅读者在安静的版面中专注内容。
- **一屏完整**：首页与关键页面力求简洁、自洽，避免信息过载。
- **明暗相宜**：内置浅色 / 深色两种模式，细节经过反复打磨。

## 特性

### 性能与 SEO

- 面向性能优化，构建产物轻量
- 基于 JSON-LD 的 SEO SCHEMA
- 支持 Google Analytics、GoatCounter 等统计
- 支持搜索引擎站点验证（Google / Bing / Baidu 等）
- 第三方资源支持 CDN
- 图片经 [lazysizes](https://github.com/aFarkas/lazysizes) 懒加载

### 外观与布局

- 桌面 / 移动端响应式
- 浅色 / 深色模式
- 全局一致的设计语言
- 文章分页
- 易用、可自展开的目录（TOC）
- 多语言与 i18n 支持
- 流畅的 CSS 动效

### 社交与评论

- 支持 Gravatar 与本地头像
- 丰富的社交链接（最多 64 个）
- 丰富的分享站点（最多 24 个）
- 支持 Gitalk、Valine、Disqus、Utterances 等评论系统

### 扩展功能

- 基于 [Lunr.js](https://lunrjs.com/) 的站内搜索（含中文分词）
- Twemoji 支持
- 代码自动高亮、一键复制
- 基于 [lightGallery](https://github.com/sachinchoolur/lightgallery) 的图片画廊
- 扩展 Markdown 语法：[Font Awesome](https://fontawesome.com/) 图标、ruby 注音、分数
- 基于 [KaTeX](https://katex.org/) 的数学公式
- 基于 [mermaid](https://github.com/mermaid-js/mermaid) 的图表
- 基于 [ECharts](https://echarts.apache.org/) 的交互式数据可视化
- 基于 [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js) 的地图
- 基于 [APlayer](https://github.com/MoePlayer/APlayer) 与 [MetingJS](https://github.com/metowolf/MetingJS) 的音乐播放器
- Bilibili 播放器
- 多种 admonitions 提示框
- 自定义样式 / 自定义脚本 shortcode

## 本地预览与构建

本主题依赖部分 JavaScript 资源，需先编译再交由 Hugo 使用。在主题目录下执行：

```bash
npm install
npm run build       # 或 npm run start 启动本地服务
```

随后在站点根目录用标准 Hugo 命令构建：

```bash
hugo --gc --minify
```

## 许可

本主题基于 **MIT** 许可开源。
