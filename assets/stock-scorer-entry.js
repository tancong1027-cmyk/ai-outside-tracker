/* ============================================================================
 * 选股评分入口 —— 把「投资至简」接进「AI 向外」
 *
 * 为什么不直接改那个 800KB 的打包文件：
 *   那个文件是 Vite 压缩过的产物，一个字符都不能错，改坏一处整个页面白屏。
 *   而这个仓库里只有打包产物、没有源代码（GitHub 上只有 gh-pages 一个分支）。
 *   所以这里用「外挂」的方式：不改它一行代码，只在它渲染完之后，
 *   往导航条末尾插一个按钮。删掉本文件、删掉 index.html 里那一行 <script>，
 *   页面就完全回到原样——随时可以反悔。
 *
 * 怎么找到插入点：
 *   那个页面是 React 渲染的，导航是一排胶囊按钮，外层是
 *   <nav class="ml-auto flex items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1">
 *   用一个选择器定位它，把按钮插在最后一个子元素之后，样式直接复用它的类名，
 *   所以看起来和「监测中心 / 标的池 / 组合实战 / 候选发现 / 规则引擎」完全一致。
 *
 * 为什么还要防重绘：
 *   React 切换标签页时可能重建整个 header，我插进去的节点会被一起清掉。
 *   所以用 MutationObserver 盯住 body，一旦发现按钮没了就补回去。
 * ========================================================================== */

(function () {
  'use strict';

  /**
   * 投资至简的地址。
   *
   * ⚠️ 这一行是唯一需要你改的地方。
   * 现在指向本机调试地址，等部署到 Vercel 之后，把它换成
   * 形如 'https://stock-scorer-xxxx.vercel.app' 的正式地址即可。
   */
  var SCORER_URL = 'http://localhost:3211';

  var BTN_ID = 'tsj-entry-btn';
  var NAV_SELECTOR = 'header nav';
  var MAX_TRIES = 40;        // 最多尝试 40 次（约 10 秒），防止页面结构异常时无限空转
  var tries = 0;

  /** 建一个和原生胶囊按钮长得一样的 <a> */
  function buildEntry() {
    var a = document.createElement('a');
    a.id = BTN_ID;
    a.href = SCORER_URL;
    a.target = '_blank';           // 新标签页打开，不打断你正在看的组合
    a.rel = 'noopener noreferrer';
    a.title = '投资至简 · 选股评分（在新标签页打开）';

    // 样式直接抄原生按钮的类：未选中态用 text-slate-400，悬停变亮
    a.className =
      'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 ' +
      'text-sm text-slate-400 transition-colors hover:text-slate-200';

    // 一个极简的图表状图标，跟这套 lucide 图标的观感对齐（16×16、1.6 描边）
    a.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 3v18h18"></path>' +
      '<path d="M7 15l3-4 3 3 4-6"></path>' +
      '</svg>' +
      '<span>选股评分</span>';

    return a;
  }

  /** 尝试插入；成功返回 true */
  function tryInject() {
    if (document.getElementById(BTN_ID)) return true;

    var nav = document.querySelector(NAV_SELECTOR);
    if (!nav) return false;

    nav.appendChild(buildEntry());
    return true;
  }

  /** 轮询等待页面渲染出导航条 */
  function poll() {
    if (tryInject()) {
      watch();
      return;
    }
    if (++tries >= MAX_TRIES) return;
    window.setTimeout(poll, 250);
  }

  /** 盯住 DOM，按钮被 React 清掉就补回去 */
  function watch() {
    var observer = new MutationObserver(function () {
      if (!document.getElementById(BTN_ID)) tryInject();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', poll);
  } else {
    poll();
  }
})();
