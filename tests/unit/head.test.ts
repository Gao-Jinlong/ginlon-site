import { describe, expect, it } from 'vitest';

import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import Head from '../../src/components/Head.astro';
import type { PageMeta } from '../../src/types/seo';

const basePageMeta: PageMeta = {
  title: 'Title',
  description: 'Description',
};

async function renderHead(pageMeta: PageMeta) {
  const container = await AstroContainer.create();
  return container.renderToString(Head, { props: { pageMeta } });
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
});
