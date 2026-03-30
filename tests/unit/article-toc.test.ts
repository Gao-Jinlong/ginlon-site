import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

const sampleHeadings = [
  { depth: 2, slug: 'section-1', text: '第一节' },
  { depth: 3, slug: 'section-1-sub', text: '子节' },
  { depth: 2, slug: 'section-2', text: '第二节' },
];

describe('article TOC components', () => {
  it('renders desktop TOC rail with sticky positioning and heading links', async () => {
    const container = await AstroContainer.create();
    const { default: ArticleTocRail } = await import(
      '../../src/components/site/ArticleTocRail.astro'
    );

    const html = await container.renderToString(ArticleTocRail, {
      props: { headings: sampleHeadings },
    });

    expect(html).toContain('文章目录');
    expect(html).toContain('#section-1');
    expect(html).toContain('第一节');
    expect(html).toContain('#section-2');
    expect(html).toContain('第二节');
    expect(html).toContain('toc-rail');
  });

  it('renders mobile TOC drawer with toggle button and hidden content', async () => {
    const container = await AstroContainer.create();
    const { default: ArticleTocDrawer } = await import(
      '../../src/components/site/ArticleTocDrawer.astro'
    );

    const html = await container.renderToString(ArticleTocDrawer, {
      props: { headings: sampleHeadings, buttonLabel: '目录' },
    });

    expect(html).toContain('目录');
    expect(html).toContain('#section-1');
    expect(html).toContain('article-toc-drawer');
  });

  it('uses new SiteLayout instead of legacy Blog layout in article page source', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/pages/blogs/[slug].astro'),
      'utf8',
    );

    expect(source).toContain('SiteLayout');
    expect(source).not.toContain('Blog.astro');
  });
});
