import { getCollection, type CollectionEntry } from 'astro:content';
import dayjs from 'dayjs';

// ── Types ──────────────────────────────────────────────

export type ColumnStatus = 'ongoing' | 'completed';

export interface Column {
  slug: string;
  title: string;
  description: string;
  poster?: string;
  status: ColumnStatus;
  articleCount: number;
}

export interface ColumnArticle {
  slug: string;
  fullSlug: string;
  title: string;
  subtitle?: string;
  poster?: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  order?: number;
  summary: string;
  draft: boolean;
}

export interface ColumnDetail extends Column {
  articles: ColumnArticle[];
}

export interface ColumnArticleDetail extends ColumnArticle {
  content: CollectionEntry<'columnArticles'>;
  column: Column;
  articles: ColumnArticle[];
  prev?: ColumnArticle;
  next?: ColumnArticle;
}

// ── Helpers ─────────────────────────────────────────────

function extractColumnSlug(id: string): string {
  const parts = id.replace(/\\/g, '/').split('/');
  return parts[0]!;
}

function extractArticleSlug(id: string): string {
  const parts = id.replace(/\\/g, '/').split('/');
  return parts.length >= 2 ? parts[1]! : parts[0]!;
}

function deriveSummaryFromBody(entry: CollectionEntry<'columnArticles'>): string {
  const rawBody = (entry as CollectionEntry<'columnArticles'> & { body?: string }).body;
  if (!rawBody) return '';

  const normalized = rawBody
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[>*_-]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.slice(0, 140);
}

function toArticleSummary(entry: CollectionEntry<'columnArticles'>): string {
  return entry.data.subtitle?.trim() || deriveSummaryFromBody(entry) || entry.data.title;
}

function sortArticles(articles: ColumnArticle[]): ColumnArticle[] {
  return [...articles].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf();
  });
}

function toColumnArticle(entry: CollectionEntry<'columnArticles'>): ColumnArticle {
  const columnSlug = extractColumnSlug(entry.id);
  const articleSlug = extractArticleSlug(entry.id);

  return {
    slug: articleSlug,
    fullSlug: `${columnSlug}/${articleSlug}`,
    title: entry.data.title,
    createdAt: entry.data.createdAt,
    tags: entry.data.tags,
    summary: toArticleSummary(entry),
    draft: entry.data.draft,
    ...(entry.data.subtitle ? { subtitle: entry.data.subtitle } : {}),
    ...(entry.data.poster ? { poster: entry.data.poster } : {}),
    ...(entry.data.updatedAt ? { updatedAt: entry.data.updatedAt } : {}),
    ...(entry.data.order !== undefined ? { order: entry.data.order } : {}),
  };
}

// ── Public API ──────────────────────────────────────────

export async function getColumns(): Promise<Column[]> {
  const isDev = process.env.NODE_ENV === 'development';

  const allColumns = await getCollection('columns', (entry) => {
    return isDev || !entry.data.draft;
  });

  const allArticles = await getCollection('columnArticles', (entry) => {
    return isDev || !entry.data.draft;
  });

  return allColumns.map((col) => {
    const columnSlug = col.id.replace(/\\/g, '/').split('/')[0]!;
    const articleCount = allArticles.filter(
      (a) => extractColumnSlug(a.id) === columnSlug,
    ).length;

    return {
      slug: columnSlug,
      title: col.data.title,
      description: col.data.description,
      status: col.data.status,
      articleCount,
      ...(col.data.poster ? { poster: col.data.poster } : {}),
    };
  });
}

export async function getColumnBySlug(slug: string): Promise<ColumnDetail | undefined> {
  const isDev = process.env.NODE_ENV === 'development';

  const allColumns = await getCollection('columns', (entry) => {
    return isDev || !entry.data.draft;
  });

  const col = allColumns.find((c) => {
    const colSlug = c.id.replace(/\\/g, '/').split('/')[0];
    return colSlug === slug;
  });

  if (!col) return undefined;

  const allArticles = await getCollection('columnArticles', (entry) => {
    return isDev || !entry.data.draft;
  });

  const articles = allArticles
    .filter((a) => extractColumnSlug(a.id) === slug)
    .map(toColumnArticle);

  const sorted = sortArticles(articles);

  return {
    slug,
    title: col.data.title,
    description: col.data.description,
    status: col.data.status,
    articleCount: sorted.length,
    articles: sorted,
    ...(col.data.poster ? { poster: col.data.poster } : {}),
  };
}

export async function getColumnArticle(
  columnSlug: string,
  articleSlug: string,
): Promise<ColumnArticleDetail | undefined> {
  const columnDetail = await getColumnBySlug(columnSlug);
  if (!columnDetail) return undefined;

  const articleIndex = columnDetail.articles.findIndex((a) => a.slug === articleSlug);
  if (articleIndex === -1) return undefined;

  const article = columnDetail.articles[articleIndex]!;

  const allEntries = await getCollection('columnArticles');
  const entry = allEntries.find((e) => {
    const colSlug = extractColumnSlug(e.id);
    const artSlug = extractArticleSlug(e.id);
    return colSlug === columnSlug && artSlug === articleSlug;
  });

  if (!entry) return undefined;

  const result: ColumnArticleDetail = {
    slug: article.slug,
    fullSlug: article.fullSlug,
    title: article.title,
    createdAt: article.createdAt,
    tags: article.tags,
    summary: article.summary,
    draft: article.draft,
    content: entry,
    column: {
      slug: columnDetail.slug,
      title: columnDetail.title,
      description: columnDetail.description,
      status: columnDetail.status,
      articleCount: columnDetail.articleCount,
      ...(columnDetail.poster ? { poster: columnDetail.poster } : {}),
    },
    articles: columnDetail.articles,
  };

  if (article.subtitle) result.subtitle = article.subtitle;
  if (article.poster) result.poster = article.poster;
  if (article.updatedAt) result.updatedAt = article.updatedAt;
  if (article.order !== undefined) result.order = article.order;
  if (articleIndex > 0) result.prev = columnDetail.articles[articleIndex - 1]!;
  if (articleIndex < columnDetail.articles.length - 1) result.next = columnDetail.articles[articleIndex + 1]!;

  return result;
}
