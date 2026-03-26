import { describe, expect, it } from 'vitest';

import {
  buildArticleDescription,
  buildCanonicalUrl,
  buildLocaleAlternates,
  mergePageMeta,
} from '../../src/utils/seo';
import { siteConfig } from '../../src/data/site';

describe('seo helpers', () => {
  it('builds the canonical URL from the Astro site URL and pathname', () => {
    expect(buildCanonicalUrl('https://www.ginlon.site', '/blogs/abc')).toBe(
      'https://www.ginlon.site/blogs/abc',
    );
  });

  it('builds a localized article description when summary is missing', () => {
    expect(buildArticleDescription('zh', 'CSP内容安全')).toBe('阅读 Ginlon 的文章《CSP内容安全》。');
    expect(buildArticleDescription('en', 'CSP Content Security')).toBe(
      'Read "CSP Content Security" on Ginlon.',
    );
  });

  it('builds locale alternates for zh and en pages', () => {
    expect(buildLocaleAlternates('https://www.ginlon.site', '/about')).toEqual([
      { hrefLang: 'zh-CN', href: 'https://www.ginlon.site/about' },
      { hrefLang: 'en', href: 'https://www.ginlon.site/en/about' },
      { hrefLang: 'x-default', href: 'https://www.ginlon.site/about' },
    ]);
  });

  it('normalizes english paths before building locale alternates', () => {
    expect(buildLocaleAlternates('https://www.ginlon.site', '/en/tags')).toEqual([
      { hrefLang: 'zh-CN', href: 'https://www.ginlon.site/tags' },
      { hrefLang: 'en', href: 'https://www.ginlon.site/en/tags' },
      { hrefLang: 'x-default', href: 'https://www.ginlon.site/tags' },
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

  it('uses absolute OG image URLs in site config', () => {
    expect(siteConfig.defaultOgImage).toBe('https://www.ginlon.site/og/site-default.png');
    expect(siteConfig.articleOgImage).toBe('https://www.ginlon.site/og/article-default.png');
  });
});
