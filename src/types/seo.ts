export type OgType = 'website' | 'article' | 'profile';

export interface AlternateLink {
  hrefLang: string;
  href: string;
}

export interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
  ogType?: OgType;
  ogImage?: string;
  keywords?: string;
  alternates?: AlternateLink[];
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
}
