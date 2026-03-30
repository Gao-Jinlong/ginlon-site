import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('en routes redirect', () => {
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
