import { describe, expect, it } from 'vitest';

import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import Head from '../../src/components/Head.astro';
import Main from '../../src/layouts/Main.astro';
import type { PageMeta } from '../../src/types/seo';

const basePageMeta: PageMeta = {
  title: 'Title',
  description: 'Description',
};

async function renderHead(pageMeta: PageMeta) {
  const container = await AstroContainer.create();
  return container.renderToString(Head, { props: { pageMeta } });
}

async function renderMain(url: string, pageTitle: string) {
  const container = await AstroContainer.create();
  return container.renderToString(Main, {
    request: new Request(url),
    props: { pageTitle },
    slots: {
      default: '<p>content</p>',
    },
  });
}

describe('Head component', () => {
  it('renders robots meta when provided', async () => {
    const html = await renderHead({ ...basePageMeta, robots: 'noindex, nofollow' });

    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"\s*\/?>/);
  });

  it('does not render robots meta when missing', async () => {
    const html = await renderHead(basePageMeta);

    expect(html).not.toContain('<meta name="robots"');
  });

  it('does not render alternate links when alternates are empty', async () => {
    const html = await renderHead({ ...basePageMeta, alternates: [] });

    expect(html).not.toContain('rel="alternate"');
  });

  it('keeps legacy en layout rendering internally consistent', async () => {
    const zhHtml = await renderMain('https://www.ginlon.site/about', 'About Me');
    const enHtml = await renderMain('https://www.ginlon.site/en/about', 'About Me');

    expect(zhHtml).toContain('<html lang="zh"');
    expect(enHtml).toContain('<html lang="en"');
    expect(enHtml).toContain('<title>About Me | Ginlon</title>');
    expect(enHtml).toContain('<link rel="canonical" href="https://www.ginlon.site/en/about"');
    expect(enHtml).not.toContain('rel="alternate"');
    expect(enHtml).toContain('href="/en/about"');
  });
});
