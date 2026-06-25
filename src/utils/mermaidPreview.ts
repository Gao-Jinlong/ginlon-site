/**
 * 把 SVG XML 字符串转成可被 <img src> 加载的 data URL。
 * 用 encodeURIComponent 而非 base64：对中文/特殊字符更安全，体积更小。
 */
export function svgXmlToDataUrl(xml: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
}
