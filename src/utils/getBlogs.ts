import { getCollection, type CollectionEntry } from 'astro:content';
import dayjs from 'dayjs';
import fs from 'node:fs';
import path from 'node:path';
import { defaultLocale, type AppLocale } from '../i18n/utils';

type BlogData = CollectionEntry<'blogs'>['data'] & {
  summary: string;
  publishedAt: string;
  lastModified?: string;
  tags: string[];
};

export type BlogCategory = 'tech' | 'note';

export type Blog = CollectionEntry<'blogs'> & {
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  featured: boolean;
  slug: string;
  data: CollectionEntry<'blogs'>['data'] & {
    summary: string;
    publishedAt: string;
    lastModified?: string;
    tags: string[];
  };
};

function toSummary(entry: CollectionEntry<'blogs'>): string {
  return entry.data.description?.trim() || entry.data.subtitle?.trim() || '';
}

function resolveLastModified(entry: CollectionEntry<'blogs'>): string | undefined {
  if (entry.data.updatedAt) {
    return entry.data.updatedAt;
  }

  try {
    const filePath = entry.filePath
      ? path.resolve(process.cwd(), entry.filePath)
      : path.join(process.cwd(), 'src/content/blogs', `${entry.id}.mdx`);

    return fs.statSync(filePath).mtime.toISOString();
  } catch {
    return undefined;
  }
}

function toNormalizedBlog(entry: CollectionEntry<'blogs'>): Blog {
  const publishedAt = entry.data.createdAt;
  const summary = toSummary(entry);
  const tags = entry.data.tags ?? [];
  const lastModified = resolveLastModified(entry);

  return {
    ...entry,
    title: entry.data.title,
    summary,
    publishedAt,
    tags,
    featured: entry.data.featured ?? false,
    slug: entry.data.permalink,
    data: {
      ...entry.data,
      summary,
      publishedAt,
      ...(lastModified ? { lastModified } : {}),
      tags,
    } satisfies BlogData,
  };
}

export async function getBlogs(_locale: AppLocale = defaultLocale, category?: BlogCategory) {
  const isDev = process.env.NODE_ENV === 'development';
  const blogs = await getCollection(
    'blogs',
    ({ data }) => data.lang === 'zh' && (isDev || !data.draft),
  );

  const sortedBlogs = blogs
    .map(toNormalizedBlog)
    .sort((a, b) => dayjs(b.publishedAt).valueOf() - dayjs(a.publishedAt).valueOf());

  if (category) {
    return sortedBlogs.filter((blog) => blog.data.category === category);
  }

  return sortedBlogs;
}
