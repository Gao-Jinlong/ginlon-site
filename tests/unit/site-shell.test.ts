import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import SiteHeader from '../../src/components/site/SiteHeader.astro';

async function renderHeader(pathname = '/') {
  const container = await AstroContainer.create();

  return container.renderToString(SiteHeader, {
    request: new Request(`https://www.ginlon.site${pathname}`),
  });
}

describe('Editorial site shell header', () => {
  it('renders simplified navigation only', async () => {
    const html = await renderHeader('/');

    expect(html).toContain('首页');
    expect(html).toContain('写作');
    expect(html).toContain('关于');
    expect(html).toContain('href="/writing"');
    expect(html).not.toContain('href="/blogs"');
    expect(html).not.toContain('href="/tags"');
    expect(html).not.toContain('href="/techStack"');
    expect(html).not.toContain('标签');
    expect(html).not.toContain('技术栈');
  });
});
