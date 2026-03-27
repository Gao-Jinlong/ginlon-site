import en from './common/en.json';
import zh from './common/zh.json';

export type AppLocale = 'zh' | 'en';

interface Dictionary {
  [key: string]: string | Dictionary | Array<string | Dictionary>;
}

const dictionaries: Record<AppLocale, Dictionary> = {
  zh,
  en,
};

export const defaultLocale: AppLocale = 'zh';
// TODO: Remove legacy en compatibility after redirect-only /en surfaces land (Task 7).
export const appLocales: AppLocale[] = ['zh'];

export function getLocaleFromUrl(url: URL): AppLocale {
  return url.pathname === '/en' || url.pathname.startsWith('/en/') ? 'en' : defaultLocale;
}

export function translate(locale: AppLocale, key: string): string {
  const value = getNestedValue(dictionaries[locale], key) ?? getNestedValue(dictionaries[defaultLocale], key);

  if (typeof value !== 'string') {
    return key;
  }

  return value;
}

export function useTranslations(locale: AppLocale) {
  return (key: string) => translate(locale, key);
}

export function getLocalizedPath(locale: AppLocale, path = ''): string {
  const normalized = path.replace(/^\/+|\/+$/g, '');

  if (locale === 'en') {
    return normalized ? `/en/${normalized}` : '/en';
  }

  return normalized ? `/${normalized}` : '/';
}

function getNestedValue(
  source: Dictionary,
  key: string,
): string | Array<string | Dictionary> | Dictionary | undefined {
  return key.split('.').reduce<unknown>((current, part) => {
    if (Array.isArray(current)) {
      return current[Number(part)];
    }

    if (current && typeof current === 'object') {
      return (current as Dictionary)[part];
    }

    return undefined;
  }, source) as string | Array<string | Dictionary> | Dictionary | undefined;
}
