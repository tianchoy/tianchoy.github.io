import { defineConfig } from 'vitepress'
import fs from 'fs';
import path from 'path';
export default defineConfig({
  title: '特严赤傲',
  description: '小田的github博客,这是一些关于学习积累、问题笔记、代码分享、生活随笔等等的记录。',
  cleanUrls: true,
  markdown: {
    lineNumbers: true // 是否显示行数
  },
  lastUpdated: true,
  themeConfig: {
    //lastUpdatedText: "Last updated",
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
      copyright: "©2025 All Rights Reserved. TianChao",
    },
  },
  vite: {
    define: {
      __ARTICLE_LIST__: JSON.stringify(
        generateArticleList(['list/diary','list/react','list/dart', 'list/Vue3', 'list/python',  'list/单片机'])
      ),
    },
  },
})

/**
 * 生成分类的文章列表
 * @param directories 目录数组
 * @returns 按目录分类的文章列表
 */

function generateArticleList(directories: string[]) {
  const categorizedArticleList: { [key: string]: { text: string; link: string }[] } = {};

  directories.forEach((directory) => {
    const guidePath = path.join(__dirname, '..', directory);
    if (!fs.existsSync(guidePath)) {
      console.warn(`Directory does not exist: ${guidePath}`);
      return;
    }

    const files = fs.readdirSync(guidePath);
    const articles = files
        .filter((file) => file.endsWith('.md'))
        .map((file) => ({
          text: file.replace('.md', ''),
          link: `/${directory}/${file.replace('.md', '')}`,
        }));

    // 使用目录名作为分类键
    const category = directory.split('/').pop() || directory;
    categorizedArticleList[category] = articles;
  });

  return categorizedArticleList;
}
