/*!
 * 中文搜索分词器 —— 站点级覆盖主题自带的 assets/lib/lunr/lunr.segmentit.js（原始 3.7MB）
 *
 * 为什么必须替换：
 * 1) 主题用 lunr-languages 的 lunr.zh.tokenizer 切中文，它依赖 lunr.segmentit 词典。
 *    官方词典 3.7MB，在 GitHub Pages 上要十几秒才能下完（实测 15s 仍未完成）；
 *    而 theme.js 必须等该脚本 onload 才 initAutosearch()，所以搜索框长期无响应，
 *    一旦加载失败（onerror 未处理）搜索就永远不初始化 —— 这就是"搜索不可用"的根因。
 * 2) lunr.zh 的 use() 把 searchPipeline 设成英文 Porter 词干器，与索引侧
 *    trimmer-zh / stemmer-zh 不一致，查询词被错误词干化（listtile → listtil、leading → lead），
 *    导致英文单词也搜不到。
 *
 * 替换策略：中文按「二元组(bigram) + 单字」切分，不需要任何词典。
 *  - 任意连续 ≥2 个汉字组成的查询都能命中（"状态栏" → 状态 / 态栏），单字也能查；
 *  - 索引侧走 lunr.segmentit.doSegment，查询侧走 lunr.queryHandler，两边同一套切分；
 *  - 查询 token 加 + 前缀，要求全部片段同时命中，避免二元组松散匹配出无关文章。
 *
 * 附带修一个渲染 bug（见文件末尾）：autocomplete 0.38.1 调用 suggestion 模板时只传 1 个参数，
 * 而 theme.js 的模板签名是 (suggestion, { query })，解构 undefined 会抛异常，
 * 导致"有结果时下拉框渲染崩溃、只显示没有找到结果"。
 */
(function (lunr) {
  if (!lunr || !lunr.version) return;

  var CJK = /[\u4e00-\u9fa5]/;
  var SEG = /[\u4e00-\u9fa5]+|[a-z0-9_]+/g;

  // withUni=true 用于建索引（单字也入索引，才能支持单字查询）；
  // 查询侧传 false，避免单字把结果放大成一片噪声
  function cut(str, withUni) {
    var s = str == null ? '' : String(str).toLowerCase();
    var out = [];
    var m;
    SEG.lastIndex = 0;
    while ((m = SEG.exec(s)) !== null) {
      var t = m[0];
      if (CJK.test(t)) {
        var i;
        if (withUni) {
          for (i = 0; i < t.length; i++) out.push(t.charAt(i));
        }
        for (i = 0; i + 2 <= t.length; i++) out.push(t.substr(i, 2));
      } else {
        out.push(t);
      }
    }
    return out;
  }

  // 索引侧入口：lunr.zh.tokenizer 会把每个 seg.w 再按空格拆分
  lunr.segmentit = {
    doSegment: function (s) {
      return cut(s, true).map(function (w) {
        return { w: w };
      });
    }
  };

  // 修正查询侧 pipeline：默认继承自英文 Porter stemmer，与索引侧口径不一致
  var zhUse = lunr.zh;
  if (typeof zhUse === 'function') {
    lunr.zh = function () {
      zhUse.call(this);
      if (this.searchPipeline) {
        this.searchPipeline.reset();
        this.searchPipeline.add(lunr.zh.trimmer, lunr.zh.stopWordFilter, lunr.zh.stemmer);
      }
    };
    // trimmer/stopWordFilter/stemmer/tokenizer 原本挂在 lunr.zh 函数对象上，
    // 覆盖 lunr.zh 后必须原样搬过来，否则 zhUse 内部读 lunr.zh.trimmer 会拿到 undefined
    ['trimmer', 'stopWordFilter', 'stemmer', 'tokenizer'].forEach(function (k) {
      lunr.zh[k] = zhUse[k];
    });
  }

  // 查询侧入口：theme.js 里 `if (lunr.queryHandler) query = lunr.queryHandler(query)`
  lunr.queryHandler = function (query) {
    var tokens = cut(query, false);
    if (!tokens.length) tokens = cut(query, true); // 单字查询的兜底
    if (!tokens.length) return '__no_query__';     // 纯符号/空串：不给结果
    return tokens
      .map(function (t) {
        return '+' + t;
      })
      .join(' ');
  };

  /*
   * autocomplete 渲染适配
   * autocomplete 0.38.1 的 Dataset._render 里是 templates.suggestion(suggestion)，
   * 只传一个参数；theme.js 的模板写成 (suggestion, { query }) => ...，
   * 第二参数为 undefined 时解构直接抛 TypeError，结果就是「有命中但列表渲染不出来」。
   * 这里在 window.autocomplete 外面包一层，替模板补上 { query }。
   * 必须放在 shim 里：此时 autocomplete.min.js 已加载、theme.js 还没调用它。
   */
  var lastQuery = '';
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener(
      'input',
      function (e) {
        var t = e.target;
        if (t && t.id && t.id.indexOf('search-input-') === 0) lastQuery = t.value;
      },
      true
    );
  }

  var origAutocomplete = window.autocomplete;
  if (typeof origAutocomplete === 'function' && !origAutocomplete.__queryPatched) {
    var patched = function (selector, options, datasets) {
      var list = Array.isArray(datasets) ? datasets : [datasets];
      list.forEach(function (ds) {
        if (!ds || !ds.templates || typeof ds.templates.suggestion !== 'function') return;
        var tpl = ds.templates.suggestion;
        ds.templates.suggestion = function (suggestion) {
          return tpl.call(this, suggestion, { query: lastQuery });
        };
      });
      return origAutocomplete.apply(this, arguments);
    };
    patched.__queryPatched = true;
    window.autocomplete = patched;
  }
})(window.lunr);
