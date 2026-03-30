import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

  it('legacy en routes redirect to Chinese equivalents', () => {
    const enIndex = readFileSync(resolve(process.cwd(), 'src/pages/en/index.astro'), 'utf8');
    const enAbout = readFileSync(resolve(process.cwd(), 'src/pages/en/about/index.astro'), 'utf8');
    const enBlogs = readFileSync(resolve(process.cwd(), 'src/pages/en/blogs/index.astro'), 'utf8');
    const enBlogSlug = readFileSync(
      resolve(process.cwd(), 'src/pages/en/blogs/[slug]/index.astro'),
      'utf8',
    );
    const enTags = readFileSync(resolve(process.cwd(), 'src/pages/en/tags/index.astro'), 'utf8');
    const enTechStack = readFileSync(
      resolve(process.cwd(), 'src/pages/en/techStack/index.astro'),
      'utf8',
    );

    expect(enIndex).toContain('RedirectPage');
    expect(enIndex).toContain('"/"');

    expect(enAbout).toContain('RedirectPage');
    expect(enAbout).toContain('"/about"');

    expect(enBlogs).toContain('RedirectPage');
    expect(enBlogs).toContain('"/writing"');

    expect(enBlogSlug).toContain('RedirectPage');
    expect(enBlogSlug).toContain('/blogs/');

    expect(enTags).toContain('RedirectPage');
    expect(enTags).toContain('"/writing"');

    expect(enTechStack).toContain('RedirectPage');
    expect(enTechStack).toContain('"/writing"');
  });
});
