import { describe, expect, it } from 'vitest';

import {
  buildCanonicalUrl,
  buildLocaleAlternates,
  mergePageMeta,
} from '../../src/utils/seo';

describe('seo helpers', () => {
  it('builds the canonical URL from the Astro site URL and pathname', () => {
    expect(buildCanonicalUrl('https://www.ginlon.site', '/writing')).toBe(
      'https://www.ginlon.site/writing',
    );
  });

  it('does not build locale alternates for the single-language baseline', () => {
    expect(buildLocaleAlternates('https://www.ginlon.site', '/writing')).toEqual([]);
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
