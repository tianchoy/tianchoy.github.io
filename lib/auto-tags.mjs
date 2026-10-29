// 文章标签自动提取
//
// 标签池刻意锁死在生活类宽标签内（见 data/tagGroups.yaml），
// 这样写作台补出来的标签和全站标签云是同一套，不会再长出长尾碎片。
// 站点现在只有「随笔」一个分类，标签池只保留生活向。
//
// 打分策略：
//   标题命中 ×4、正文命中按出现次数累加（封顶 4 次）、分类默认标签 ×2；
//   按生活向加权，避免正文只是提到某个词就被打成标签。

export const TAG_POOL = {
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
// 站点只有「随笔」一个分类，关键词只保留生活向
const KEYWORDS = {
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
// 站点现在只有「随笔」一个分类
const CATEGORY_DEFAULTS = {
  随笔: ["随笔", "生活", "回忆"],
};

const TECH_TAGS = new Set(TAG_POOL.技术 || []);
const LIFE_TAGS = new Set(TAG_POOL.生活);

const LIFE_CATEGORY_NAMES = new Set(["随笔", "日记", "diary", "生活", "散文"]);

// 站点已无技术分类，保留为空即可（写技术文时自行加分类会自动识别为技术）
const TECH_CATEGORY_NAMES = new Set([]);

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
  // 已有标签按小写比，用户手填 vue3 时不再补一个 Vue3（Hugo 里是同一个 term）
  const existingLower = new Set(existing.map((t) => t.toLowerCase()));
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
    if (existingLower.has(tag.toLowerCase())) continue;
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
    if (existingLower.has(tag.toLowerCase())) continue;
    if (techCat === true && !TECH_TAGS.has(tag)) continue;
    scores.set(tag, (scores.get(tag) || 0) + 2);
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);

  if (ranked.length >= missing) return ranked.slice(0, missing);

  // 还是不够：按「通用但不出错」的顺序补位（仅生活向）
  const LIFE_FILLER = ["随笔", "生活", "回忆", "写作", "人生", "时间", "自我"];
  const filler = [
    ...(CATEGORY_DEFAULTS[category] || []),
    ...LIFE_FILLER,
    ...TAG_POOL.生活,
  ];
  const out = ranked.slice();
  for (const t of filler) {
    if (out.length >= missing) break;
    if (!existingLower.has(t.toLowerCase()) && !out.includes(t)) out.push(t);
  }
  return out.slice(0, missing);
}

export function allTags() {
  return [...(TAG_POOL.技术 || []), ...TAG_POOL.生活];
}
