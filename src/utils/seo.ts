import type { AlternateLink, PageMeta } from '../types/seo';

export function buildCanonicalUrl(site: string, pathname: string): string {
  return new URL(pathname, site).toString();
}

export function buildLocaleAlternates(_site: string, _pathname: string): AlternateLink[] {
  return [];
}

export function mergePageMeta(defaults: PageMeta, overrides: Partial<PageMeta>): PageMeta {
  return { ...defaults, ...overrides };
}
