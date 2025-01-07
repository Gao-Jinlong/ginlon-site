import { astroI18n } from 'astro-i18n';
import { getCollection, type CollectionEntry } from 'astro:content';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';

interface BlogData extends CollectionEntry<'blogs'> {
  data: {
    draft?: boolean;
    lang: string;
    layout: string;
    title: string;
    subtitle?: string;
    poster: string;
    permalink: string;
    createdAt: string;
    lastModified?: Date;
  };
}

export async function getBlogs() {
  const localizedBlogs = await getCollection('blogs', ({ data }) => {
    return !data.draft;
  });

  const locale = astroI18n.locale;
  const fallbackLocale = astroI18n.fallbackLocale;
  const primaryLocale = astroI18n.primaryLocale;
  const secondaryLocales = astroI18n.secondaryLocales;

  const blogs = [...secondaryLocales, primaryLocale].map(locale => {
    return {
      locale,
      blogs: localizedBlogs.filter(blog => blog.data.lang === locale),
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

  [...fallbackLocaleBlogs, ...primaryLocaleBlogs].forEach(
    (blog: CollectionEntry<'blogs'>) => {
      const id = blog.id;
      if (!finalBlogMap.has(id)) {
        const filePath = path.join(process.cwd(), 'src/content/blogs', blog.id);
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

  return Array.from(finalBlogMap.values()).sort((a, b) => {
    return dayjs(b.data.createdAt).unix() - dayjs(a.data.createdAt).unix();
  });
}
