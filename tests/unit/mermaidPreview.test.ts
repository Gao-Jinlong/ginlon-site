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
