import { appLocales, defaultLocale, getLocalizedPath, type AppLocale } from '../i18n/utils';
import type { AlternateLink, PageMeta } from '../types/seo';

const hrefLangMap: Record<AppLocale, string> = {
  zh: 'zh-CN',
  en: 'en',
};

function normalizePathname(pathname: string): string {
  const normalizedPath = pathname.replace(/^\/+|\/+$/g, '');

  if (!normalizedPath || normalizedPath === defaultLocale) {
    return '/';
  }

  const segments = normalizedPath.split('/');

  if (appLocales.includes(segments[0] as AppLocale)) {
    segments.shift();
  }

  const withoutDefaultLocale = segments.join('/');

  return withoutDefaultLocale ? `/${withoutDefaultLocale}` : '/';
}

export function buildCanonicalUrl(site: string, pathname: string): string {
  return new URL(pathname, site).toString();
}

export function buildLocaleAlternates(site: string, pathname: string): AlternateLink[] {
  const normalizedPath = normalizePathname(pathname);

  const alternates = appLocales.map((locale) => ({
    hrefLang: hrefLangMap[locale],
    href: buildCanonicalUrl(site, getLocalizedPath(locale, normalizedPath)),
  }));

  alternates.push({
    hrefLang: 'x-default',
    href: buildCanonicalUrl(site, getLocalizedPath(defaultLocale, normalizedPath)),
  });

  return alternates;
}

export function mergePageMeta(defaults: PageMeta, overrides: Partial<PageMeta>): PageMeta {
  return { ...defaults, ...overrides };
}
