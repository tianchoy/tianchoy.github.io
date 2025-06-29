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
 * 生成分类的文章列表（完整修复版）
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
  
  // 获取要扫描的目录列表
  const targetDirs = categories.length > 0 
    ? categories.map(cat => path.join(baseDir, cat))
    : fs.readdirSync(path.join(process.cwd(), baseDir))
        .filter(dir => {
          const dirPath = path.join(process.cwd(), baseDir, dir)
          return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()
        })
        .map(dir => path.join(baseDir, dir))

  targetDirs.forEach(directory => {
    const fullPath = path.join(process.cwd(), directory)
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`目录不存在: ${fullPath}`)
      return
    }

    const category = path.basename(directory)
    if (excludeDirs.includes(category)) return

    const articles: Article[] = []

    fs.readdirSync(fullPath)
      .filter(file => file.endsWith('.md') && !excludeFiles.includes(file))
      .forEach(file => {
        try {
          const filePath = path.join(fullPath, file)
          const content = fs.readFileSync(filePath, 'utf-8')
          const { data: frontmatter } = matter(content)

          // 关键修复：确保生成的链接路径正确
          const relativeDir = path.relative('docs', directory)
          const articlePath = path.join(relativeDir, file.replace('.md', ''))
          
          articles.push({
            text: frontmatter.title || formatFilename(file.replace('.md', '')),
            link: `/${articlePath.replace(/\\/g, '/')}`, // 确保使用正斜杠
            date: frontmatter.date,
            order: frontmatter.order
          })
        } catch (error) {
          console.error(`处理文件 ${file} 时出错:`, error)
        }
      })

    // 排序逻辑
    articles.sort((a, b) => {
      if (sortBy === 'date' && a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortBy === 'order') {
        return (a.order || 0) - (b.order || 0)
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
 * 格式化文件名
 */
function formatFilename(filename: string): string {
  return filename
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

// Vitepress 配置
export default defineConfig({
  srcDir: 'docs', // 关键配置：指定源文件目录
  title: '特严赤傲',
  description: '小田的github博客',
  cleanUrls: true,
  
  markdown: {
    lineNumbers: true,
  },

  lastUpdated: true,

  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "文章", link: "/list/" }, // 确保这个路径与你的目录结构匹配
      { text: "Github", link: "https://github.com/tianchoy" },
    ],
    
    search: {
      provider: 'local'
    },

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

    footer: {
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