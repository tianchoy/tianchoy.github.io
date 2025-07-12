<script setup>
import { onMounted } from 'vue'

const articleList = __ARTICLE_LIST__;

// 处理分类链接点击
const handleCategoryClick = (e, category) => {
  e.preventDefault()
  const target = document.getElementById(category)
  if (target) {
    const offset = 20 // 额外的偏移量，根据需要调整
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    })

    // 更新URL哈希（可选）
    history.pushState(null, null, `#${category}`)
  }
}

// 初始化时检查哈希并滚动到对应位置
onMounted(() => {
  if (window.location.hash) {
    const category = window.location.hash.substring(1)
    const target = document.getElementById(category)
    if (target) {
      setTimeout(() => { // 等待页面布局稳定
        const offset = 20
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset
        window.scrollTo({
          top: targetPosition,
          behavior: 'auto'
        })
      }, 100)
    }
  }
})
</script>

<template>
  <div class="article-container">
    <div class="categories">
      <ul>
        <li v-for="(articles, category) in articleList" :key="category" class="category-item">
          <a :href="`#${category}`" @click="(e) => handleCategoryClick(e, category)">
            {{ category }}
          </a>
        </li>
      </ul>
    </div>

    <div class="articles">
      <div v-for="(articles, category) in articleList" :key="category" :id="category" class="category-section">
        <p class="category-title">{{ category }}</p>
        <ul>
          <li v-for="article in articles" :key="article.link" class="article-item">
            <a :href="article.link" target="_blank">{{ article.text }}</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-container {
  position: relative;
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.categories {
  flex: 0 0 200px;
  position: fixed;
  width: 15rem;
  left: 5rem;
  top: 4rem;
  text-align: center;
  height: fit-content;
  background-color: #f5f5f5;
}

.articles {
  flex: 1;
  margin-left: 10rem;
}

.category-item {
  margin-bottom: 0.5rem;
}

.category-item a {
  display: block;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: background-color 0.2s;
}

.category-item a:hover {
  background-color: var(--vp-c-bg-mute);
}

.category-section {
  margin-bottom: 6rem;
  scroll-margin-top: 1rem;
}

.category-title {
  font-size: 2rem;
  font-weight: 700;
  padding-top: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.category-title::before {
  content: "";
  display: block;
  height: 1rem;
  margin-top: -1rem;
  visibility: hidden;
}

.article-item {
  margin-bottom: 0.5rem;
}

.article-item a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s;
}

.article-item a:hover {
  color: var(--vp-c-brand);
}

@media (max-width: 768px) {
  .article-container {
    flex-direction: column;
  }

  .categories {
    position: static;
    margin-bottom: 2rem;
  }

  .articles {
    margin-left: 0;
  }
}
</style>