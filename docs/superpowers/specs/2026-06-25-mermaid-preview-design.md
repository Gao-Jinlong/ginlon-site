# Mermaid 图表预览浮层 · 设计文档

- 日期：2026-06-25
- 状态：待实现
- 涉及页面：`src/pages/blogs/[slug].astro`、`src/pages/columns/[slug]/[article].astro`

## 1. 目标

让博客/专栏正文里的 mermaid 图「点击即放大」，复用项目已有的 Viewer.js 图片预览器，缩放（滚轮/按钮）、拖拽、旋转手势与正文图片完全一致，且 mermaid 图与正文图片**共享同一个预览队列**（可上下张翻页）。

明确不做的事（YAGNI）：不加下载按钮、不加全屏按钮、不自定义 Viewer 工具栏、不抽 Vue 组件、不预生成双主题 data URL。

## 2. 背景与约束（已核对代码库）

- **Mermaid 渲染方式**：`astro-mermaid` 集成。markdown 的 ` ```mermaid ` 代码块在产物 HTML 里是 `<pre class="mermaid">原始定义文本</pre>`；页面加载后由 astro-mermaid 注入的脚本在**客户端**异步调用 `mermaid.render()`，把 `<pre>` 内容替换为内联 `<svg>`，并给 `<pre>` 加 `data-processed` 属性。astro-mermaid **不暴露渲染完成事件**。
- **主题自动跟随**：astro-mermaid 内置 `MutationObserver` 监听 `data-theme`，切换主题时会移除 `data-processed`、重新渲染 svg。
- **现有图片预览**：`[slug].astro` 与 `[article].astro` 在 `astro:page-load` 里对 `.article-body` 调用 `new Viewer(body, {...})`，实例存到模块作用域变量 `articleViewer`。Viewer.js 构造时**快照**当前 `<img>` 列表；后续插入新 `<img>` 必须调用 `viewer.update()` 才能被收录。
- **View Transitions**：`SiteLayout.astro` 用了 `<ClientRouter />`，每次导航触发 `astro:page-load`，现有代码已在该事件里重建 TOC 与 Viewer。
- **Viewer.js 只认 `<img>`**：mermaid 渲染出的是内联 SVG，无法直接被 Viewer 收录，必须先转成图片形式。

## 3. 方案选型（已与用户确认）

- 预览实现：**复用 Viewer.js**（不引入新库、不自研浮层）。
- 触发方式：**点击图即放大**（整图可点击，`cursor: zoom-in` + 悬停高亮提示）。
- 队列策略：**同一预览队列**（mermaid 与正文图片混排，可互相翻页），不隔离。
- 主题处理：**随主题重生成**（不预生成双主题）。
- SVG → 图片的实现：**原地替换为 `<img src="data:image/svg+xml,...">`**（保留矢量清晰度，天然进入现有 Viewer 队列，零侵入）。

## 4. 架构与数据流

页面加载后的数据流：

```
HTML 产物:  <pre class="mermaid">flowchart ...</pre>          ← 原始定义文本
              │  (astro-mermaid 注入脚本异步渲染)
              ▼
            <pre class="mermaid" data-processed><svg>...</svg></pre>
              │  (本设计新增的「封装」步骤，见第 5 节)
              ▼
            <pre class="mermaid" data-processed>
              <img class="mermaid-img" src="data:image/svg+xml;charset=utf-8,...">
            </pre>
              │  (封装后调用 articleViewer.update()，Viewer 重新扫描 <img>)
              ▼
点击 mermaid-img → Viewer.js 浮层（缩放/拖拽/旋转/上下张）
```

两个关键时序点：

1. **封装时机**：必须在 astro-mermaid 把 svg 插入 `<pre>` **之后**。用 `MutationObserver` 监听 `.article-body`，当某个 `pre.mermaid` 满足「有 `data-processed` 且内有 `<svg>` 且没有 `img.mermaid-img`」时封装。
2. **Viewer 队列更新**：封装插入 `<img>` 后立即 `articleViewer?.update()`。这是整个方案最易踩的坑——Viewer 构造时快照了列表，不调 `update()` 新 `<img>` 不会进队列。

## 5. 封装逻辑

### 5.1 纯函数 `svgElementToDataUrl(svg)`

把「SVG → data URL」抽成可单测的纯函数（放 `src/utils/mermaidPreview.ts`）：

```ts
export function svgElementToDataUrl(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // 可选：移除 mermaid 注入的无意义随机 id，减小 data URL 体积
  const xml = new XMLSerializer().serializeToString(clone);
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
}
```

用 `encodeURIComponent` 而非 `btoa`（base64）：对中文/特殊字符更安全，体积更小。

### 5.2 封装函数 `wrapMermaidImage(pre)`

```ts
function wrapMermaidImage(pre: HTMLPreElement): boolean {
  const svg = pre.querySelector('svg');
  if (!svg) return false;                       // 渲染失败（astro-mermaid 插了错误 div）→ 不动
  const img = document.createElement('img');
  img.src = svgElementToDataUrl(svg as SVGSVGElement);
  img.alt = 'Mermaid 图表';
  img.className = 'mermaid-img';
  img.loading = 'lazy';
  pre.replaceChildren(img);                     // <pre> 保留作布局容器
  return true;
}
```

封装成功的判定：`pre.querySelector('svg')` 存在。封装完成后 `<img>` 替换了 svg。

### 5.3 触发与去重：MutationObserver

```ts
const needsWrap = (pre: Element) =>
  pre.hasAttribute('data-processed')
  && !!pre.querySelector('svg')
  && !pre.querySelector('img.mermaid-img');

function scanAndWrap() {
  document.querySelectorAll('pre.mermaid').forEach((pre) => {
    if (needsWrap(pre)) {
      if (wrapMermaidImage(pre as HTMLPreElement)) {
        articleViewer?.update();                // 收录新 <img>
      }
    }
  });
}

const mo = new MutationObserver(() => scanAndWrap());
mo.observe(document.querySelector('.article-body')!, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['data-processed'],
});
scanAndWrap();                                  // 快路径：扫一遍已就绪的
```

**去重策略**：用「pre 里有 `img.mermaid-img` 就跳过」判断，天然幂等；**不在 `<pre>` 上留标记属性**——因为主题重渲染时 astro-mermaid 会清空 `<pre>` 内容重插新 svg，此时 img 消失、svg 回来，`needsWrap` 再次为 true，自然触发重封装新主题图。这比「打标记 + 主题切换时手动清标记」更鲁棒。

**observer 时序验证**：`attributeFilter: ['data-processed']` 的选择依据是 astro-mermaid 集成源码（`node_modules/astro-mermaid/astro-mermaid-integration.js` 约 434-435 行）——它在 `diagram.innerHTML = svg` 之后**紧接着** `setAttribute('data-processed','true')`。因此监听 `data-processed` 触发时 svg 必然已在 DOM 中，`needsWrap` 稳定为 true，不会出现「有 data-processed 但 svg 还没插」的空封装。

## 6. 生命周期（View Transitions 与主题切换）

钩在现有 `astro:page-load` 事件里（与 TOC、Viewer 同一处），保证导航后重建：

| 事件 | 现有动作 | 新增动作 |
|---|---|---|
| `astro:page-load` | 重建 TOC；`new Viewer(body)` 存 `articleViewer` | 销毁上一个 observer；`scanAndWrap()` 快路径；新建 observer 监听 `.article-body` |
| 主题切换（`data-theme` 变化） | astro-mermaid 自动移除 `data-processed` → 重渲染 svg | observer 监听 `data-processed` 重新出现 → `needsWrap` 为 true（img 没了）→ 重封装 + `update()` |

**模块作用域变量**：observer 句柄存到模块顶层变量（如 `mermaidObserver`），`astro:page-load` 开头先 `mermaidObserver?.disconnect()`，避免多次导航叠加多个 observer。

**全局 Viewer 引用**：现有 `articleViewer` 已是模块作用域变量，封装函数在同一 `<script>` 内直接引用，用 `articleViewer?.update()` 可选链，Viewer 已销毁/未就绪时安全。

## 7. 样式

加在两个文章页各自的 `<style>` 块（与现有 `.article-rule` / `.reading-center` 同处，符合项目「文章页局部样式」习惯；两个页面是仅有的 mermaid 使用点，重复约 10 行可接受）：

```css
pre.mermaid { cursor: zoom-in; transition: background-color .15s ease; }
pre.mermaid:hover { background-color: rgba(125,125,125,.08); }
[data-theme="dark"] pre.mermaid:hover { background-color: rgba(255,255,255,.06); }
.mermaid-img { max-width: 100%; height: auto; }
```

- `cursor: zoom-in` + 背景高亮 = 不依赖颜色的点击提示。
- `.mermaid-img { max-width:100% }`：大图在正文自适应缩小（不再靠 astro-mermaid 的 `overflow:auto` 出滚动条），细节看不清就点开放大。
- **不覆盖** astro-mermaid 注入的渲染前骨架动画与 `pre.mermaid` 布局样式。

## 8. 可访问性

- `<img alt="Mermaid 图表">`：非空 alt，屏幕阅读器识别；Viewer 已关 `title`，不干扰。
- Viewer.js 浮层自带键盘支持（Esc 关闭、方向键翻页、`+/-` 缩放），无需额外实现。
- 不为 mermaid 单独加 `role="button"` / `tabindex`：它是 `<img>`，点击行为由 Viewer 统一接管，与现有图片预览的无障碍模型一致。

## 9. 降级与边界

| 场景 | 处理 |
|---|---|
| mermaid 渲染失败（无 svg，有错误 div） | `wrapMermaidImage` 找不到 svg 返回 false，不封装；用户看到 astro-mermaid 原错误提示，不崩溃 |
| Viewer.js 加载失败 | `articleViewer` 为 null，封装仍把 svg 换成 img，img 仍是普通可缩放图，核心内容不丢 |
| Viewer 实例已销毁（页面切换中） | `articleViewer?.update()` 可选链，安全无副作用 |
| SVG 体积大（超复杂图） | data URL 较长但浏览器可处理；`encodeURIComponent` 对中文/符号安全；不设硬上限 |
| observer 多次扫到同一图 | `needsWrap` 判「有无 img.mermaid-img」去重，幂等 |
| `<foreignObject>` + 外部 CSS | 本项目 mermaid 未使用（已核对 langgraph-notes 专栏），序列化后样式简化属可接受降级 |

## 10. 测试与验证

### 10.1 vitest 单测（覆盖纯函数）

新增 `src/utils/mermaidPreview.test.ts`：

- 输入含中文节点文字的 svg → 输出以 `data:image/svg+xml;charset=utf-8,` 开头；`decodeURIComponent` 后含原文中文。
- 输入含 `<` `>` `&` 的 svg → 正确转义无损坏。

### 10.2 手动验证清单（实施时逐项过）

1. `pnpm dev` 打开含 mermaid 的专栏文章（如 `/columns/langgraph-notes/04-pregel-bsp`）。
2. 页面加载后 mermaid 图正常显示，视觉与改动前一致。
3. 悬停：光标变 `zoom-in`，背景轻微高亮。
4. 点击图：弹出 Viewer 浮层，工具栏含缩放/拖拽/旋转。
5. 滚轮缩放、拖拽、旋转均生效；矢量放大不糊。
6. 同一队列：点 mermaid 进浮层后，按 →/← 能翻到正文图片，反之亦然。
7. 切换明/暗主题：mermaid 在正文随主题重渲染，重新封装后再次点击放大，颜色跟随主题；控制台无报错、无重复封装。
8. View Transition 跳到另一篇文章：新页面 mermaid 仍可点击放大；旧 observer 已断开（无内存泄漏/重复触发）。

### 10.3 构建验证（遵循 AGENTS.md）

- `pnpm build` 必须 exit 0（astro check + frontmatter schema）。
- 构建日志里 `[astro-mermaid]` 块数与文章中 mermaid 块数一致（确认未破坏 astro-mermaid 渲染）。
- 本设计为纯客户端行为，**产物 HTML 不变**（mermaid 仍是 `<pre class="mermaid">原始文本`），无需额外产物检查。

## 11. 落地位置汇总

模块拆分遵循「纯逻辑可单测、页面副作用留在页面」原则：

| 文件 | 改动 | 说明 |
|---|---|---|
| `src/utils/mermaidPreview.ts`（新增） | 纯函数 `svgElementToDataUrl(svg)` 与 `wrapMermaidImage(pre)` | 不依赖 Viewer/全局变量，仅操作 DOM 入参，可单测 |
| `src/utils/mermaidPreview.test.ts`（新增） | vitest 单测 | 覆盖 §10.1 |
| `src/pages/blogs/[slug].astro` | `<script>` 内引入 `mermaidPreview.ts`，写 observer + 生命周期，封装后调 `articleViewer.update()`；`<style>` 加 mermaid 悬停样式 | observer 逻辑因依赖页面作用域的 `articleViewer` 与 `.article-body` 选择器，留在页面 `<script>` 中，不进 utils |
| `src/pages/columns/[slug]/[article].astro` | 同上 | 两个页面的 `<script>` 段会重复 observer 设置逻辑（约 20 行），属可接受重复；若实施时发现重复明显，可把 observer 设置也抽成接收 `(container, getViewer)` 的函数进 utils，但这不改变设计结论 |

**函数边界**：`svgElementToDataUrl` / `wrapMermaidImage` 入参是 DOM 节点、无副作用外溢（除 `pre.replaceChildren`）、不读全局；observer、`articleViewer` 引用、`astro:page-load` 钩子留在页面 `<script>`。这样纯函数可独立单测，页面副作用集中可读。
