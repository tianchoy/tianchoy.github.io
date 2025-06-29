import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// 类型定义
interface Article {
  text: string
  link: string
  date?: string
  order?: number
}

interface GenerateOptions {
  baseDir?: string
  categories?: string[]
  excludeDirs?: string[]
  excludeFiles?: string[]
  sortBy?: 'date' | 'order' | 'title'
}

/**
 * 生成分类的文章列表（优化版）
 * @param options 配置选项
 * @returns 按目录分类的文章列表
 */
function generateArticleList(options: GenerateOptions = {}): Record<string, Article[]> {
  const {
    baseDir = 'docs/list',
    categories = [],
    excludeDirs = [],
    excludeFiles = ['index.md'],
    sortBy = 'date'
  } = options

  const result: Record<string, Article[]> = {}
  const targetDirs = categories.length > 0 
    ? categories.map(cat => path.join(baseDir, cat))
    : [baseDir]

  targetDirs.forEach(directory => {
    const fullPath = path.join(__dirname, '..', directory)
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Directory does not exist: ${fullPath}`)
      return
    }

    // 获取分类名称（最后一级目录名）
    const category = directory.split('/').pop() || directory
    if (excludeDirs.includes(category)) return

    const articles: Article[] = []

    fs.readdirSync(fullPath)
      .filter(file => file.endsWith('.md') && !excludeFiles.includes(file))
      .forEach(file => {
        const filePath = path.join(fullPath, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const { data: frontmatter } = matter(content)

        articles.push({
          text: frontmatter.title || formatFilename(file.replace('.md', '')),
          link: `/${directory}/${file.replace('.md', '')}`,
          date: frontmatter.date,
          order: frontmatter.order
        })
      })

    // 排序逻辑
    articles.sort((a, b) => {
      if (sortBy === 'date' && a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortBy === 'order' && a.order !== undefined && b.order !== undefined) {
        return (a.order - b.order)
      }
      return a.text.localeCompare(b.text)
    })

    if (articles.length > 0) {
      result[category] = articles
    }
  })

  return result
}

/**
 * 格式化文件名（可选）
 * 将连字符/下划线转换为空格并首字母大写
 */
function formatFilename(filename: string): string {
  return filename
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

// Vitepress 配置
export default defineConfig({
  title: '特严赤傲',
  description: '小田的github博客,这是一些关于学习积累、问题笔记、代码分享、生活随笔等等的记录。',
  cleanUrls: true,
  
  markdown: {
    lineNumbers: true,
  },

  lastUpdated: true,

  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "文章", link: "/list/" },
      { text: "Github", link: "https://github.com/tianchoy" },
    ],
    
    search: {
      provider: 'local'
    },

    // 自动生成侧边栏
    sidebar: {
      '/list/': [
        {
          text: '文章分类',
          items: Object.entries(
            generateArticleList({
              categories: ['diary', 'react', 'dart', 'Vue3', 'python', '单片机'],
              sortBy: 'date'
            })
          ).map(([category, articles]) => ({
            text: category,
            link: `/list/${category}/`,
            items: articles
          }))
        }
      ]
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    footer: {
      message: "",
      copyright: "©2025 All Rights Reserved. TianChao",
    },
  },

  vite: {
    define: {
      __ARTICLE_LIST__: JSON.stringify(
        generateArticleList({
          categories: ['diary', 'react', 'dart', 'Vue3', 'python', '单片机'],
          sortBy: 'date'
        })
      )
    }
  }
})