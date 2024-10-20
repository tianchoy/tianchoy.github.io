import { defineConfig } from 'vitepress'
export default defineConfig({
  title: '特严赤傲',
  description: '小田的github博客,这是一些关于学习积累、问题笔记、代码分享、生活随笔等等的记录。',
  cleanUrls: true,
  markdown: {
    lineNumbers: true // 是否显示行数
  },
  lastUpdated: true,
  themeConfig: {
    lastUpdatedText: "Last updated",
    nav: [
      { text: "首页", link: "/" },
      { text: "文章", link: "/list/" },
      { text: "Github", link: "https://github.com/tianchoy" },
    ],
    search: {
      provider: 'local'
    },
    docFooter: {
      prev: true,
      next: true
    },
    footer: {
      message: "",
      copyright: "©2023-2024 All Rights Reserved. TianChao",
    },
  },
})
