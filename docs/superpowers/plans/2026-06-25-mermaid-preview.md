# Mermaid 图表预览浮层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让博客/专栏正文里的 mermaid 图点击后用现有 Viewer.js 放大查看（缩放/拖拽/旋转），且与正文图片共享同一个预览队列。

**Architecture:** astro-mermaid 在客户端异步把 `<pre class="mermaid">` 渲染成内联 SVG。本方案用 `MutationObserver` 监听 `data-processed` 属性（astro-mermaid 在 `innerHTML = svg` 之后才设它，时序可靠），渲染完成后把 SVG 序列化成 `data:image/svg+xml` data URL，原地替换成 `<img class="mermaid-img">`，再调用现有 `articleViewer.update()` 让它进入 Viewer 队列。纯字符串逻辑（`svgXmlToDataUrl`）抽进 `src/utils/` 可单测，DOM/observer 逻辑留在页面 `<script>`。

**Tech Stack:** Astro 5、原生 DOM API（`XMLSerializer`/`MutationObserver`）、viewerjs（已装）、vitest（`environment: 'node'`，无 jsdom）。

**Spec:** `docs/superpowers/specs/2026-06-25-mermaid-preview-design.md`

---

## 文件结构

| 文件 | 责任 |
|---|---|
| `src/utils/mermaidPreview.ts`（新增） | 纯函数 `svgXmlToDataUrl(xml: string): string`，无 DOM 依赖，可单测 |
| `tests/unit/mermaidPreview.test.ts`（新增） | 覆盖 `svgXmlToDataUrl` 的中文/特殊字符转义 |
| `src/pages/blogs/[slug].astro`（修改） | `<script>` 加 mermaid 封装 + observer 生命周期；`<style>` 加悬停样式 |
| `src/pages/columns/[slug]/[article].astro`（修改） | 同上 |

**测试环境注意**：项目 vitest 配置 `environment: 'node'`，未装 jsdom。因此 `svgXmlToDataUrl` 设计为纯字符串函数（入参是 XML 字符串，不碰 DOM），可在 node 环境单测；DOM 依赖的 `wrapMermaidImage`/observer 留在页面 `<script>`，靠手动验证。

---

## Task 1: 纯函数 `svgXmlToDataUrl` + 单测（TDD）

**Files:**
- Create: `src/utils/mermaidPreview.ts`
- Test: `tests/unit/mermaidPreview.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/unit/mermaidPreview.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { svgXmlToDataUrl } from '../../src/utils/mermaidPreview';

describe('svgXmlToDataUrl', () => {
  it('生成带正确 MIME 前缀的 data URL', () => {
    const url = svgXmlToDataUrl('<svg></svg>');
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
  });

  it('中文内容经 decodeURIComponent 后完整保留', () => {
    const xml = '<svg><text>局部计算</text></svg>';
    const url = svgXmlToDataUrl(xml);
    const payload = url.slice('data:image/svg+xml;charset=utf-8,'.length);
    expect(decodeURIComponent(payload)).toBe(xml);
  });

  it('特殊字符 < > & " 被正确转义且可无损还原', () => {
    const xml = '<svg a="x&amp;y">&lt;z&gt;</svg>';
    const url = svgXmlToDataUrl(xml);
    const payload = url.slice('data:image/svg+xml;charset=utf-8,'.length);
    expect(decodeURIComponent(payload)).toBe(xml);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm test tests/unit/mermaidPreview.test.ts`
Expected: FAIL，报错类似 `Failed to resolve import "../../src/utils/mermaidPreview"` 或 `svgXmlToDataUrl is not a function`。

- [ ] **Step 3: 写最小实现**

创建 `src/utils/mermaidPreview.ts`：

```ts
/**
 * 把 SVG XML 字符串转成可被 <img src> 加载的 data URL。
 * 用 encodeURIComponent 而非 base64：对中文/特殊字符更安全，体积更小。
 */
export function svgXmlToDataUrl(xml: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm test tests/unit/mermaidPreview.test.ts`
Expected: PASS（3 个测试全过）。

- [ ] **Step 5: 提交**

```bash
git add src/utils/mermaidPreview.ts tests/unit/mermaidPreview.test.ts
git commit -m "feat(mermaid): add svgXmlToDataUrl pure util with tests"
```

---

## Task 2: 博客页接入 mermaid 预览（`[slug].astro`）

**Files:**
- Modify: `src/pages/blogs/[slug].astro`（在现有 `astro:page-load` 图片预览 `<script>` 之后追加；在 `<style>` 追加样式）

**前置知识**（实施前必读，已核对源码 `node_modules/astro-mermaid/astro-mermaid-integration.js`）：
- astro-mermaid 注入的脚本在 `diagram.innerHTML = svg` 之后**紧接着** `diagram.setAttribute('data-processed','true')`（约 434-435 行）。
- 因此监听 `data-processed` 触发时，svg 必然已在 DOM 中。
- 现有图片预览代码已在 `astro:page-load` 里 `new Viewer(body)` 存到模块变量 `articleViewer`（约 178-204 行）。我们的 mermaid 封装逻辑**必须挂在同一个 `astro:page-load` 事件**，且在 `articleViewer` 赋值之后执行，这样封装调用的 `articleViewer.update()` 才有实例可用。

- [ ] **Step 1: 在 `<script>` 末尾追加 mermaid 封装 + observer 逻辑**

在 `src/pages/blogs/[slug].astro` 现有 `<script>` 块（含 TOC 与图片预览逻辑）的**末尾、`</script>` 之前**追加：

```ts
  // mermaid 图预览：astro-mermaid 渲染完成后，把内联 SVG 换成 <img>，
  // 复用上面同一组 Viewer 实例（articleViewer），让 mermaid 进图片预览队列。
  let mermaidObserver: MutationObserver | null = null;
  document.addEventListener('astro:page-load', () => {
    const body = document.querySelector('.article-body');
    if (!(body instanceof HTMLElement)) return;

    mermaidObserver?.disconnect();
    mermaidObserver = null;

    // 纯字符串 → data URL（utils，可单测）；DOM 序列化在此处调用
    const wrapMermaidImage = (pre: HTMLPreElement): boolean => {
      const svg = pre.querySelector('svg');
      if (!svg) return false; // 渲染失败（astro-mermaid 插了错误 div，无 svg）→ 不动
      const xml = new XMLSerializer().serializeToString(svg);
      const img = document.createElement('img');
      img.src = svgXmlToDataUrl(xml);
      img.alt = 'Mermaid 图表';
      img.className = 'mermaid-img';
      img.loading = 'lazy';
      pre.replaceChildren(img); // <pre> 保留作布局容器
      return true;
    };

    const needsWrap = (pre: Element): boolean =>
      pre.hasAttribute('data-processed') &&
      !!pre.querySelector('svg') &&
      !pre.querySelector('img.mermaid-img');

    const scanAndWrap = () => {
      let changed = false;
      document.querySelectorAll('pre.mermaid').forEach((pre) => {
        if (needsWrap(pre)) {
          changed = wrapMermaidImage(pre as HTMLPreElement) || changed;
        }
      });
      if (changed) articleViewer?.update(); // 让 Viewer 收录新 <img>
    };

    scanAndWrap(); // 快路径：扫一遍已就绪的

    // 监听 data-processed：astro-mermaid 渲染完 svg 后会设它；
    // 主题切换时它会先移除再重设 → 重新封装新主题 svg（去重靠 needsWrap 的 img 判断）
    mermaidObserver = new MutationObserver(scanAndWrap);
    mermaidObserver.observe(body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-processed'],
    });
  });
```

同时在同一个 `<script>` 顶部 import 区（即现有 `document.addEventListener` 之前，因 Astro `<script>` 是模块，import 须在顶层）追加 import。Astro 的 `<script>` 标签会编译为 ES 模块，可使用 `import`。在 `<script>` 标签内第一行加：

```ts
import { svgXmlToDataUrl } from '../../utils/mermaidPreview';
```

> 注：`articleViewer` 是该 `<script>` 内已声明的模块作用域变量（约 178 行 `let articleViewer = null`），封装逻辑可闭包访问它。`articleViewer?.update()` 用可选链，Viewer 未就绪时安全。

- [ ] **Step 2: 在 `<style>` 块追加 mermaid 悬停样式**

在 `src/pages/blogs/[slug].astro` 现有 `<style>` 内（`.reading-center` 等规则附近）追加：

```css
  pre.mermaid {
    cursor: zoom-in;
    transition: background-color 0.15s ease;
  }

  pre.mermaid:hover {
    background-color: rgba(125, 125, 125, 0.08);
  }

  [data-theme='dark'] pre.mermaid:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }

  .mermaid-img {
    max-width: 100%;
    height: auto;
  }
```

- [ ] **Step 3: 运行构建验证类型 + schema**

Run: `pnpm build`
Expected: exit 0（`astro check` 类型检查通过，frontmatter schema 通过，完整静态构建成功）。构建日志里 `[astro-mermaid]` 块数若有 mermaid 的博客应 > 0。

- [ ] **Step 4: 手动验证（开发服务器）**

Run: `pnpm dev`，打开一篇**含 mermaid 图的博客**（若当前无 mermaid 博客，先用专栏验证，本步骤可跳到 Task 3 完成后一起验）：
1. 页面加载后 mermaid 图正常显示，视觉与改动前一致。
2. 悬停：光标变 `zoom-in`，背景轻微高亮。
3. 点击图：弹出 Viewer 浮层，工具栏含缩放/拖拽/旋转。
4. 滚轮缩放、拖拽、旋转均生效，矢量放大不糊。
5. 控制台无报错。

- [ ] **Step 5: 提交**

```bash
git add src/pages/blogs/[slug].astro
git commit -m "feat(mermaid): 点击放大博客正文 mermaid 图（复用 Viewer.js）"
```

---

## Task 3: 专栏文章页接入 mermaid 预览（`[article].astro`）

**Files:**
- Modify: `src/pages/columns/[slug]/[article].astro`

逻辑与 Task 2 完全相同（页面 `<script>` 结构一致：同样有 `articleViewer` 变量、`astro:page-load` 图片预览段、`<style>` 块）。参考 langgraph-notes 专栏验证。

- [ ] **Step 1: 在 `<script>` 顶部加 import**

在 `src/pages/columns/[slug]/[article].astro` 现有 mermaid 相关的第一个 `<script>`（TOC 段）或图片预览 `<script>` 的**第一行**加：

```ts
import { svgXmlToDataUrl } from '../../../../utils/mermaidPreview';
```

> 路径深度核对：文件位于 `src/pages/columns/[slug]/[article].astro`，到 `src/utils/` 需回退 4 层（`../../../../`）→ `src/utils/mermaidPreview`。实施时若构建报路径错，用 `pnpm build` 报错信息校正层数。

- [ ] **Step 2: 在图片预览 `<script>` 末尾追加封装逻辑**

该文件有两个 `<script>`：一个 TOC（132-195 行），一个图片预览（197-226 行）。在**图片预览那个 `<script>` 的末尾**追加与 Task 2 Step 1 完全相同的 mermaid 封装 + observer 代码块（即 `let mermaidObserver` ... 到 `mermaidObserver.observe(...)` 那一整段，逐字一致，不要改）。

为避免漏抄，完整代码块如下（与 Task 2 Step 1 相同）：

```ts
  // mermaid 图预览：astro-mermaid 渲染完成后，把内联 SVG 换成 <img>，
  // 复用上面同一组 Viewer 实例（articleViewer），让 mermaid 进图片预览队列。
  let mermaidObserver: MutationObserver | null = null;
  document.addEventListener('astro:page-load', () => {
    const body = document.querySelector('.article-body');
    if (!(body instanceof HTMLElement)) return;

    mermaidObserver?.disconnect();
    mermaidObserver = null;

    const wrapMermaidImage = (pre: HTMLPreElement): boolean => {
      const svg = pre.querySelector('svg');
      if (!svg) return false;
      const xml = new XMLSerializer().serializeToString(svg);
      const img = document.createElement('img');
      img.src = svgXmlToDataUrl(xml);
      img.alt = 'Mermaid 图表';
      img.className = 'mermaid-img';
      img.loading = 'lazy';
      pre.replaceChildren(img);
      return true;
    };

    const needsWrap = (pre: Element): boolean =>
      pre.hasAttribute('data-processed') &&
      !!pre.querySelector('svg') &&
      !pre.querySelector('img.mermaid-img');

    const scanAndWrap = () => {
      let changed = false;
      document.querySelectorAll('pre.mermaid').forEach((pre) => {
        if (needsWrap(pre)) {
          changed = wrapMermaidImage(pre as HTMLPreElement) || changed;
        }
      });
      if (changed) articleViewer?.update();
    };

    scanAndWrap();

    mermaidObserver = new MutationObserver(scanAndWrap);
    mermaidObserver.observe(body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-processed'],
    });
  });
```

- [ ] **Step 3: 在 `<style>` 追加悬停样式**

在该文件现有 `<style>` 块内追加（与 Task 2 Step 2 完全相同）：

```css
  pre.mermaid {
    cursor: zoom-in;
    transition: background-color 0.15s ease;
  }

  pre.mermaid:hover {
    background-color: rgba(125, 125, 125, 0.08);
  }

  [data-theme='dark'] pre.mermaid:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }

  .mermaid-img {
    max-width: 100%;
    height: auto;
  }
```

- [ ] **Step 4: 运行构建验证**

Run: `pnpm build`
Expected: exit 0。构建日志含 `[astro-mermaid] Remark transformed mermaid block` 且块数 = langgraph-notes 等专栏里的 mermaid 块总数（≥4）。

- [ ] **Step 5: 手动验证（专栏，重点场景）**

Run: `pnpm dev`，打开 `/columns/langgraph-notes/04-pregel-bsp`（含 mermaid flowchart）：
1. mermaid 图正常显示，视觉与改动前一致。
2. 悬停光标变 `zoom-in`、背景高亮。
3. 点击 → Viewer 浮层，缩放/拖拽/旋转生效，矢量不糊。
4. **同一队列**：点 mermaid 进浮层后，按 →/← 能翻到正文里的图片（若该篇有图），反之亦然。
5. **主题切换**：切明/暗主题，mermaid 在正文随主题重渲染，重新封装后再次点击放大，颜色跟随主题；控制台无报错、无重复封装（看 network/DOM 确认 pre 内只有一个 img）。
6. **View Transition**：点导航跳到另一篇专栏文章，新页面 mermaid 仍可点击放大；老页面 observer 已断开（无重复触发）。

- [ ] **Step 6: 提交**

```bash
git add src/pages/columns/[slug]/[article].astro
git commit -m "feat(mermaid): 点击放大专栏文章 mermaid 图（复用 Viewer.js）"
```

---

## Task 4: 全量构建 + 测试回归

**Files:** 无新增

- [ ] **Step 1: 跑全部单测**

Run: `pnpm test`
Expected: 全部 PASS（含 Task 1 的 mermaidPreview.test.ts 与原有所有测试）。

- [ ] **Step 2: 跑生产构建**

Run: `pnpm build`
Expected: exit 0。`astro check` 无类型错误，schema 校验通过。

- [ ] **Step 3: 确认 astro-mermaid 渲染未受影响**

在构建日志里搜索 `[astro-mermaid]`：
- 含 mermaid 的专栏应出现 `Remark transformed mermaid block #N in ...` 且 N 与专栏里的 mermaid 块数一致。
- 说明我们的纯客户端改动没有破坏 astro-mermaid 的 markdown→svg 流水线。

- [ ] **Step 4: 产物抽查（可选但推荐）**

本设计是纯客户端行为，产物 HTML 里 mermaid 仍是 `<pre class="mermaid">原始文本</pre>`（我们的 JS 只在浏览器跑）。可抽查确认：

Run（Git Bash）：在 `dist/` 下确认某篇 mermaid 文章 html 里仍是 `<pre class="mermaid">` 而非已替换的 `<img>`。用 Grep 工具搜 `dist/` 下 `class="mermaid"` 存在即可。

---

## Self-Review（写计划时已完成）

1. **Spec 覆盖**：§3 方案 → Task 2/3；§5 封装 → Task 2/3 Step1-2；§6 生命周期（observer/disconnect/主题重封装）→ Task 2/3 Step1；§7 样式 → Task 2/3 Step2/3；§8 无障碍（alt/键盘）→ 内建于代码；§9 降级（svg 缺失、Viewer 未就绪）→ 代码 `if(!svg)return false` 与 `articleViewer?.update()`；§10 测试 → Task 1（单测）+ Task 3 Step5（手动）。全覆盖。
2. **占位符扫描**：无 TBD/TODO，所有代码块完整。
3. **类型一致**：`svgXmlToDataUrl` 签名（入参 string）在 Task1/2/3 一致；`wrapMermaidImage`/`needsWrap`/`scanAndWrap` 在 Task2/3 逐字一致；`articleViewer` 沿用现有变量名。
