<script setup>
const articleList = __ARTICLE_LIST__;
</script>

<template>
  <div>
    <div v-for="(articles, category) in articleList" :key="category">
      <h2>{{ category }}</h2>
      <ul>
        <li v-for="article in articles" :key="article.link">
          <a :href="article.link">{{ article.text }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>