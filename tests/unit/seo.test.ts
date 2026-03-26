import { describe, expect, it } from 'vitest';

import {
  buildCanonicalUrl,
  buildLocaleAlternates,
  mergePageMeta,
} from '../../src/utils/seo';
import type { PageMeta } from '../../src/types/seo';

describe('seo helpers', () => {
  it('builds the canonical URL from the Astro site URL and pathname', () => {
    expect(buildCanonicalUrl('https://www.ginlon.site', '/blogs/abc')).toBe(
      'https://www.ginlon.site/blogs/abc',
    );
  });

  it('builds locale alternates for zh and en pages', () => {
    expect(buildLocaleAlternates('https://www.ginlon.site', '/about')).toEqual([
      { hrefLang: 'zh-CN', href: 'https://www.ginlon.site/about' },
      { hrefLang: 'en', href: 'https://www.ginlon.site/en/about' },
      { hrefLang: 'x-default', href: 'https://www.ginlon.site/about' },
    ]);
  });

  it('lets page-level values override layout defaults', () => {
    expect(
      mergePageMeta(
        { title: 'Default', description: 'Default description' },
        { title: 'About', ogType: 'profile' },
      ),
    ).toMatchObject({
      title: 'About',
      description: 'Default description',
      ogType: 'profile',
    });
  });

  it('keeps article metadata when merged with layout defaults', () => {
    expect(
      mergePageMeta(
        { title: 'Default', description: 'Default', ogType: 'website' },
        {
          title: 'Post title',
          description: 'Post desc',
          ogType: 'article',
          tags: ['frontend'],
        },
      ),
    ).toMatchObject({
      title: 'Post title',
      description: 'Post desc',
      ogType: 'article',
      tags: ['frontend'],
    });
  });

  it('types hidden-page meta with robots directives', () => {
    const hiddenPageMeta = {
      title: 'Hidden resume',
      description: 'Only Chinese content',
      robots: 'noindex, nofollow',
    } satisfies PageMeta;

    expect(hiddenPageMeta.robots).toBe('noindex, nofollow');
  });

  it('allows pages to disable alternates and set robots directives', () => {
    expect(
      mergePageMeta(
        {
          title: 'Default',
          description: 'Default description',
          alternates: [{ hrefLang: 'zh-CN', href: 'https://www.ginlon.site/resume' }],
        },
        {
          alternates: [],
          robots: 'noindex, nofollow',
        },
      ),
    ).toMatchObject({
      alternates: [],
      robots: 'noindex, nofollow',
    });
  });
});
