import DefaultTheme from 'vitepress/theme';
import ArticleList from './ArticleList.vue';

export default {
    ...DefaultTheme, // 继承默认主题
    enhanceApp({ app }) {
        // 注册全局组件
        app.component('ArticleList', ArticleList);
    },
};