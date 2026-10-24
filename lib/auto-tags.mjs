// 文章标签自动提取
//
// 标签池刻意锁死在站点现有的 44 个宽标签内（见 data/tagGroups.yaml），
// 这样写作台补出来的标签和全站标签云是同一套，不会再长出长尾碎片。
//
// 打分策略：
//   标题命中 ×4、正文命中按出现次数累加（封顶 4 次）、分类默认标签 ×2；
//   再按分类给「技术池 / 生活池」加权（日记里的技术词、技术文里的抒情词都降权），
//   避免正文只是提到某个词就被打成标签。

export const TAG_POOL = {
  技术: [
    "前端",
    "Vue3",
    "TypeScript",
    "React",
    "Flutter",
    "跨端开发",
    "小程序",
    "组件",
    "构建工具",
    "开发环境",
    "命令行",
    "Mac",
    "Git",
    "踩坑",
    "笔记",
    "教程",
    "表格",
    "Python",
    "物联网",
  ],
  生活: [
    "散文",
    "随笔",
    "诗歌",
    "小说",
    "回忆",
    "生活",
    "青春",
    "人生",
    "思念",
    "亲情",
    "家乡",
    "小城",
    "城市生活",
    "冬天",
    "四季",
    "夜晚",
    "梦",
    "音乐",
    "工作",
    "时间",
    "节日",
    "上海",
    "朋友",
    "写作",
    "自我",
  ],
};

// 关键词只用于「命中判断」，不需要穷举，覆盖常见写法即可
const KEYWORDS = {
  前端: ["css", "html", "dom", "flex", "布局", "样式", "响应式", "浏览器", "表单", "渐变", "动画", "页面", "ui", "交互", "像素", "居中", "markdown", "主题"],
  Vue3: ["vue", "vue3", "vue.js", "composition api", "setup", "ref(", "reactive", "defineprops", "defineemits", "插槽", "slot", "vben", "element plus", "element-plus", "pinia", "vue-router", "v-model", "单文件组件"],
  TypeScript: ["typescript", "ts", "泛型", "类型", "interface", "enum", "类型系统", "d.ts", "类型推断", "断言"],
  React: ["react", "hooks", "usestate", "useeffect", "jsx", "tsx", "redux", "next.js"],
  Flutter: ["flutter", "dart", "widget", "statefulwidget", "statelesswidget", "cupertino", "material", "listtile", "safearea", "pubspec", "build context", "firebase", "热重载"],
  跨端开发: ["uniapp", "uni-app", "uts", "跨端", "跨平台", "鸿蒙", "harmonyos", "react native", "多端", "一套代码", "安卓", "ios", "app端"],
  小程序: ["小程序", "微信开发者工具", "openid", "云开发", "云函数", "订阅消息", "小程序码", "wx.request", "授权登录"],
  组件: ["组件", "component", "传值", "通信", "封装", "生命周期", "事件总线", "mitt", "插槽", "复用", "父子"],
  构建工具: ["vite", "webpack", "rollup", "打包", "构建", "npm", "yarn", "pnpm", "依赖", "包管理", "编译", "node_modules", "babel", "esbuild", "hugo", "静态站点", "静态博客", "部署", "front matter"],
  开发环境: ["mac", "macos", "macbook", "homebrew", "brew", "环境", "安装", "配置", "编辑器", "vscode", "vim", "模拟器", "windows", "开发工具", "插件"],
  命令行: ["命令行", "终端", "shell", "bash", "zsh", "vim", "sudo", "chmod", "命令行工具", "终端命令"],
  Mac: ["mac", "macos", "macbook", "苹果", "finder", "brew"],
  Git: ["git", "github", "gitlab", "gitcode", "commit", "分支", "仓库", "merge", "push", "pull", "版本控制", "冲突", "rebase"],
  踩坑: ["报错", "错误", "error", "失败", "无法", "不生效", "踩坑", "解决", "白屏", "bug", "坑", "异常", "崩溃", "闪退", "不显示"],
  笔记: ["笔记", "记录", "小结", "整理", "备忘"],
  教程: ["教程", "步骤", "如何", "怎么", "指南", "入门", "实践", "示例", "用法", "方法"],
  表格: ["表格", "table", "分页", "导出", "excel", "图表", "echart", "数据列表", "列宽", "行数据"],
  Python: ["python", "pyinstaller", "pip", "pandas", "脚本", "exe", "虚拟环境"],
  物联网: ["物联网", "esp8266", "固件", "烧录", "刷机", "智能家居", "米家", "miot", "单片机", "传感器", "设备", "插件sdk"],

  散文: ["散文", "时光", "岁月", "风景", "文字", "情绪", "记忆里", "那时候"],
  随笔: ["随笔", "杂记", "想法", "随手", "心情", "最近", "突然想起"],
  诗歌: ["诗歌", "押韵", "分行", "诗句"],
  小说: ["小说", "故事", "虚构", "情节", "人物", "他说", "她说"],
  回忆: ["回忆", "记得", "小时候", "童年", "从前", "过去", "那年", "记忆", "多年以后", "以前"],
  生活: ["生活", "日子", "日常", "吃饭", "买菜", "街道", "邻居", "家里", "周末", "烟火气"],
  青春: ["青春", "少年", "年轻", "成长", "梦想", "理想", "十八", "学生", "毕业"],
  人生: ["人生", "活着", "意义", "孤独", "命运", "选择", "世界", "思考", "一生", "活着"],
  思念: ["思念", "想念", "怀念", "想你", "想他", "梦里", "挂念"],
  亲情: ["父亲", "母亲", "爸爸", "妈妈", "妹妹", "姐姐", "哥哥", "弟弟", "家人", "亲人", "亲情", "女儿", "儿子", "姥姥", "奶奶", "爷爷"],
  家乡: ["家乡", "老家", "故乡", "村子", "村里", "院子", "回来", "回老家", "田里", "拆迁"],
  小城: ["小城", "县城", "小镇", "镇上", "市里", "街口", "老街"],
  城市生活: ["城市", "地铁", "租房", "通勤", "打工", "下班", "楼上", "小区"],
  冬天: ["冬天", "雪", "冷", "腊月", "冬至", "寒风", "腊八", "初雪", "下雪"],
  四季: ["春天", "夏天", "秋天", "季节", "花开", "落叶", "银杏", "下雨", "蝉鸣", "雁"],
  夜晚: ["夜晚", "夜里", "失眠", "凌晨", "深夜", "睡不着", "月亮", "半夜"],
  梦: ["梦", "梦境", "做梦", "噩梦"],
  音乐: ["音乐", "歌", "吉他", "乐队", "演唱会", "旋律", "琴", "专辑", "耳机"],
  工作: ["工作", "上班", "公司", "老板", "同事", "加班", "项目", "程序员", "离职", "工资", "需求", "会议"],
  时间: ["时间", "转眼", "年底", "年末", "一年", "今年", "去年", "岁", "2025", "2026", "生日", "纪念"],
  节日: ["春节", "新年", "过年", "中秋", "端午", "圣诞", "元旦", "除夕", "元宵", "节日", "寒衣", "中元", "腊月二十三", "年味"],
  上海: ["上海", "浦东", "外滩", "魔都", "虹桥"],
  朋友: ["朋友", "兄弟", "聚会", "喝酒", "聊天", "发小", "同学", "哥们"],
  写作: ["写作", "写字", "博客", "投稿", "稿子", "写点", "这篇文章", "打字"],
  自我: ["自己", "我是谁", "内心", "性格", "独处", "反思", "镜子", "自我"],
};

// 分类默认标签：分类名（content/posts 下的目录名或 frontmatter categories）→ 标签
const CATEGORY_DEFAULTS = {
  diary: ["随笔", "生活", "回忆"],
  日记: ["随笔", "生活", "回忆"],
  Vue3: ["Vue3", "前端", "组件"],
  vue: ["Vue3", "前端", "组件"],
  Flutter: ["Flutter", "跨端开发", "组件"],
  flutter: ["Flutter", "跨端开发", "组件"],
  dart: ["Flutter", "跨端开发", "组件"],
  python: ["Python", "开发环境", "笔记"],
  Python: ["Python", "开发环境", "笔记"],
  react: ["React", "组件", "前端"],
  React: ["React", "组件", "前端"],
  单片机: ["物联网", "踩坑", "教程"],
  小程序: ["小程序", "跨端开发", "踩坑"],
};

const TECH_TAGS = new Set(TAG_POOL.技术);
const LIFE_TAGS = new Set(TAG_POOL.生活);

const LIFE_CATEGORY_NAMES = new Set(["diary", "日记", "随笔", "生活", "散文"]);

const TECH_CATEGORY_NAMES = new Set([
  "vue3",
  "vue",
  "flutter",
  "dart",
  "python",
  "react",
  "单片机",
  "小程序",
  "javascript",
  "typescript",
  "css",
  "node",
  "后端",
  "前端",
  "tools",
  "tool",
]);

// true=技术分类，false=生活分类，null=不认识（不加权）
function isTechCategory(category) {
  const c = String(category || "").trim();
  if (!c) return null;
  const low = c.toLowerCase();
  if (LIFE_CATEGORY_NAMES.has(low)) return false;
  if (TECH_CATEGORY_NAMES.has(low)) return true;
  return null;
}

// 英文关键词按词边界匹配，中文直接子串计数
function countHits(haystack, needle) {
  if (!needle) return 0;
  const n = needle.toLowerCase();
  if (/^[a-z0-9][a-z0-9 ._/#+-]*$/.test(n)) {
    // 英文/符号词：前后不能紧邻字母数字，避免 "ts" 命中 "tests"
    const re = new RegExp(`(^|[^a-z0-9])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "g");
    let c = 0;
    while (re.exec(haystack) && c < 20) c++;
    return c;
  }
  let c = 0;
  let i = haystack.indexOf(n);
  while (i !== -1 && c < 20) {
    c++;
    i = haystack.indexOf(n, i + n.length);
  }
  return c;
}

/**
 * @param {{title?:string, content?:string, category?:string, existing?:string[], need?:number}} input
 * @returns {string[]} 需要补充的标签（不含 existing，最多 need - existing.length 个）
 */
export function suggestTags(input = {}) {
  const title = String(input.title || "").trim();
  const content = String(input.content || "");
  const category = String(input.category || "").trim();
  const existing = (Array.isArray(input.existing) ? input.existing : [])
    .map((t) => String(t).trim())
    .filter(Boolean);
  const need = Math.max(0, Number(input.need) || 5);
  const missing = need - existing.length;
  if (missing <= 0) return [];

  const titleText = title.toLowerCase();
  // 正文去掉 markdown 语法噪声，代码块保留（技术词多在代码里）
  const bodyText = content
    .replace(/```[\s\S]*?```/g, " $& ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .toLowerCase();

  const techCat = isTechCategory(category);
  const scores = new Map();

  for (const [tag, words] of Object.entries(KEYWORDS)) {
    if (existing.includes(tag)) continue;
    let score = 0;
    for (const w of words) {
      const inTitle = countHits(titleText, w);
      const inBody = countHits(bodyText, w);
      if (!inTitle && !inBody) continue;
      score += inTitle * 4;
      // 正文命中：1 + 0.5*(n-1)，封顶 4 次
      if (inBody) score += 1 + 0.5 * (Math.min(inBody, 4) - 1);
    }
    if (!score) continue;

    // 分类倾向：技术分类只要技术标签（正文里的抒情词会被「状态栏→自我」这类误命中串味）；
    // 日记则生活标签优先，技术标签降权但仍然可用（日记里也会写建站、代码）
    if (techCat === true) {
      if (!TECH_TAGS.has(tag)) continue;
      score *= 1.25;
    } else if (techCat === false) {
      if (TECH_TAGS.has(tag)) score *= 0.7;
      else if (LIFE_TAGS.has(tag)) score *= 1.25;
    }
    scores.set(tag, score);
  }

  // 分类默认标签兜底（命中为 2 分，能压过零散的单词命中）
  for (const tag of CATEGORY_DEFAULTS[category] || []) {
    if (existing.includes(tag)) continue;
    if (techCat === true && !TECH_TAGS.has(tag)) continue;
    scores.set(tag, (scores.get(tag) || 0) + 2);
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);

  if (ranked.length >= missing) return ranked.slice(0, missing);

  // 还是不够：按「通用但不出错」的顺序补位。
  // 直接按标签池顺序补会补出 TypeScript / React 这种跟正文无关的栈名，所以这里单列一张补位表。
  const TECH_FILLER = ["笔记", "教程", "踩坑", "组件", "前端", "构建工具", "开发环境"];
  const LIFE_FILLER = ["随笔", "生活", "回忆", "写作", "人生", "时间", "自我"];
  const filler = [
    ...(CATEGORY_DEFAULTS[category] || []),
    ...(techCat === false ? LIFE_FILLER : TECH_FILLER),
    ...(techCat === true ? TAG_POOL.技术 : TAG_POOL.生活),
    ...TAG_POOL.生活,
    ...TAG_POOL.技术,
  ];
  const out = ranked.slice();
  for (const t of filler) {
    if (out.length >= missing) break;
    if (!existing.includes(t) && !out.includes(t)) out.push(t);
  }
  return out.slice(0, missing);
}

export function allTags() {
  return [...TAG_POOL.技术, ...TAG_POOL.生活];
}
