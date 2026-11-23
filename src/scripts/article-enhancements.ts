/**
 * 文章页共享增强脚本：TOC 滚动高亮 + 图片预览（Viewer.js）+ mermaid 图封装。
 * 由 blogs/[slug].astro 与 columns/[slug]/[article].astro 共用，逻辑保持单一来源。
 */
import { svgXmlToDataUrl, injectSvgBackground } from '../utils/mermaidPreview';
import type Viewer from 'viewerjs';

// ---------------------------------------------------------------------------
// TOC 滚动高亮：高亮「当前阅读位置上方最近的标题」对应项。
// 用 scroll + getBoundingClientRect 直接计算，比 IntersectionObserver 更可控、
// 无 rootMargin 语义陷阱。哨兵线位于视口顶部下方 SENTINEL_PX 处（避开 sticky header）。
// ---------------------------------------------------------------------------
const SENTINEL_PX = 100; // 与 sticky header 高度匹配

let tocCleanup: (() => void) | null = null;
let lastActiveId: string | null = null;

function setupTocSpy() {
  tocCleanup?.();
  tocCleanup = null;
  lastActiveId = null;

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'));
  if (links.length === 0) return;

  const headings: { id: string; el: HTMLElement; link: HTMLAnchorElement }[] = [];
  links.forEach((link) => {
    const id = link.getAttribute('href')?.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el) headings.push({ id, el, link });
  });
  if (headings.length === 0) return;

  let ticking = false;

  const setActive = (id: string) => {
    if (id === lastActiveId) return;
    links.forEach((l) => l.classList.remove('is-active'));
    const target = headings.find((h) => h.id === id);
    target?.link.classList.add('is-active');
    lastActiveId = id;
  };

  const update = () => {
    // 找顶部边界已越过哨兵线的最后一个标题；都在哨兵线下方时高亮第一个
    let current = headings[0]!.id;
    for (const h of headings) {
      if (h.el.getBoundingClientRect().top <= SENTINEL_PX) {
        current = h.id;
      } else {
        break;
      }
    }
    setActive(current);
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  update(); // 初次定位（页面进入时可能已滚到中部）
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  tocCleanup = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

// ---------------------------------------------------------------------------
// 图片预览：点击正文图片放大查看（Viewer.js）
// ---------------------------------------------------------------------------
let articleViewer: Viewer | null = null;

async function setupViewer() {
  const body = document.querySelector('.article-body');
  if (!(body instanceof HTMLElement)) return;

  // 销毁上一页遗留的实例，避免重复绑定
  articleViewer?.destroy();
  articleViewer = null;

  const { default: Viewer } = await import('viewerjs');
  articleViewer = new Viewer(body, {
    toolbar: {
      zoomIn: true,
      zoomOut: true,
      oneToOne: true,
      reset: true,
      prev: true,
      play: false,
      next: true,
      rotateLeft: true,
      rotateRight: true,
      flipHorizontal: true,
      flipVertical: true,
    },
    title: false,
  });
}

// ---------------------------------------------------------------------------
// mermaid 图预览：astro-mermaid 渲染完成后，把内联 SVG 换成 <img>，
// 复用同一个 Viewer 实例（articleViewer），让 mermaid 进图片预览队列。
// ---------------------------------------------------------------------------
let mermaidObserver: MutationObserver | null = null;

function setupMermaidPreview() {
  const body = document.querySelector('.article-body');
  if (!(body instanceof HTMLElement)) return;

  mermaidObserver?.disconnect();
  mermaidObserver = null;

  // 纯字符串 → data URL（utils，可单测）；DOM 序列化在此处调用
  const wrapMermaidImage = (pre: HTMLPreElement): boolean => {
    const svg = pre.querySelector('svg');
    if (!svg) return false; // 渲染失败（astro-mermaid 插了错误 div，无 svg）→ 不动
    const clone = svg.cloneNode(true) as SVGSVGElement;
    // mermaid 的 svg 用 width="100%"+viewBox 但无显式 height，
    // 序列化成 <img> 后固有尺寸会失真（变成很小的默认值）。
    // 这里据 viewBox 设回像素宽高，让 <img> 按正确比例渲染。
    const vb = clone.getAttribute('viewBox');
    const m = vb ? vb.match(/\S+\s+\S+\s+([\d.]+)\s+([\d.]+)/) : null;
    const vbW = m?.[1];
    const vbH = m?.[2];
    if (vbW && vbH) {
      clone.setAttribute('width', vbW);
      clone.setAttribute('height', vbH);
    }
    let xml = new XMLSerializer().serializeToString(clone);
    // mermaid SVG 透明背景：放进 Viewer 浮层会透出底部文章内容、影响阅读。
    // 注入一个覆盖整图的主题色背景 rect（读 theme.css 的 --page-bg，而非硬编码色值）。
    if (vbW && vbH) {
      const bg =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--page-bg')
          .trim() || '#faf8f3';
      xml = injectSvgBackground(xml, vbW, vbH, bg);
    }
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
}

document.addEventListener('astro:page-load', () => {
  setupTocSpy();
  setupMermaidPreview();
});

document.addEventListener('astro:page-load', () => {
  void setupViewer();
});
