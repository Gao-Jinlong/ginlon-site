/**
 * 把 SVG XML 字符串转成可被 <img src> 加载的 data URL。
 * 用 encodeURIComponent 而非 base64：对中文/特殊字符更安全，体积更小。
 */
export function svgXmlToDataUrl(xml: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
}

/**
 * 在 SVG 根标签后插入一个覆盖整图的背景 <rect>。
 *
 * mermaid 渲染出的 SVG 是透明背景，序列化成 <img> 后，放进 Viewer.js
 * 半透明遮罩浮层里会透出底部文章内容、影响阅读。插入一个填满 viewBox
 * 的纯色 rect（作为 svg 第一个子元素 = z 序最底）即可让图不透明。
 *
 * 纯字符串操作，不依赖 DOM，可在 node 环境单测。
 */
export function injectSvgBackground(
  xml: string,
  width: string,
  height: string,
  color: string,
): string {
  const rect = `<rect width="${width}" height="${height}" fill="${color}"></rect>`;
  return xml.replace(/^(<svg[^>]*>)/, `$1${rect}`);
}
