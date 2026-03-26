import { getCollection, type CollectionEntry } from 'astro:content';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import { defaultLocale, type AppLocale } from '../i18n/utils';

type BlogData = CollectionEntry<'blogs'> & {
  data: CollectionEntry<'blogs'>['data'] & {
    lastModified?: Date;
  };
};

export type BlogCategory = 'tech' | 'note';

export interface Blog {
  data: {
    title: string;
    subtitle?: string;
    createdAt: string;
    lastModified?: string;
    poster?: string;
    posterDescription?: string;
    category: BlogCategory;
  };
  slug: string;
}

export async function getBlogs(locale: AppLocale = defaultLocale, category?: BlogCategory) {
  const isDev = process.env.NODE_ENV === 'development';
  const localizedBlogs = await getCollection('blogs', ({ data }) => {
    return isDev || !data.draft;
  });

  const fallbackLocale = defaultLocale;
  const locales: AppLocale[] = ['en', defaultLocale];

  const blogs = locales.map(localeName => {
    return {
      locale: localeName,
      blogs: localizedBlogs.filter(blog => blog.data.lang === localeName),
    };
  });

  const finalBlogMap = new Map<string, BlogData>();

  const fallbackLocaleBlogs =
    blogs.find(blog => blog.locale === fallbackLocale)?.blogs || [];
  const primaryLocaleBlogs =
    blogs.find(blog => blog.locale === locale)?.blogs || [];

  const getLastModifiedTime = (filePath: string) => {
    try {
      const stats = fs.statSync(filePath);
      return stats.mtime;
    } catch (error) {
      console.error(`Error getting last modified time for ${filePath}:`, error);
      return new Date();
    }
  };

  [...primaryLocaleBlogs, ...fallbackLocaleBlogs].forEach(
    (blog: CollectionEntry<'blogs'>) => {
      const id = blog.id;
      if (!finalBlogMap.has(id)) {
        const filePath = blog.filePath
          ? path.resolve(process.cwd(), blog.filePath)
          : path.join(process.cwd(), 'src/content/blogs', `${blog.id}.mdx`);
        const lastModified = getLastModifiedTime(filePath);
        finalBlogMap.set(id, {
          ...blog,
          data: {
            ...blog.data,
            lastModified,
          },
        } as BlogData);
      }
    },
  );

  const sortedBlogs = Array.from(finalBlogMap.values()).sort((a, b) => {
    return dayjs(b.data.createdAt).unix() - dayjs(a.data.createdAt).unix();
  });

  if (category) {
    return sortedBlogs.filter((blog) => blog.data.category === category);
  }

  return sortedBlogs;
}
