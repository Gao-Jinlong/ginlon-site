import { describe, expect, it } from 'vitest';
import { svgXmlToDataUrl, injectSvgBackground } from '../../src/utils/mermaidPreview';

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

describe('injectSvgBackground', () => {
  it('在根 svg 标签后插入覆盖整图的背景 rect', () => {
    const xml = '<svg viewBox="0 0 100 50"><circle/></svg>';
    const out = injectSvgBackground(xml, '100', '50', '#ffffff');
    // rect 应紧跟 <svg ...> 之后、其它内容之前（z 序最底）
    expect(out).toMatch(/^<svg[^>]*><rect[^>]*fill="#ffffff"[^>]*><\/rect><circle\/><\/svg>$/);
  });

  it('rect 的 width/height 取传入参数', () => {
    const out = injectSvgBackground('<svg><g/></svg>', '305.9', '436', '#131714');
    expect(out).toContain('<rect width="305.9" height="436"');
    expect(out).toContain('fill="#131714"');
  });

  it('保留 svg 根标签上的原有属性', () => {
    const xml = '<svg id="m1" width="100%" viewBox="0 0 10 10"><rect/></svg>';
    const out = injectSvgBackground(xml, '10', '10', '#fff');
    expect(out).toContain('<svg id="m1" width="100%" viewBox="0 0 10 10">');
  });
});
