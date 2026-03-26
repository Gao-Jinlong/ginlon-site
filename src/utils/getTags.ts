import { getCollection } from 'astro:content';
import { defaultLocale, type AppLocale } from '../i18n/utils';

export interface Tag {
  name: string;
  slug: string;
  count: number;
}

/**
 * 将标签名称转换为安全的URL slug
 */
export function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/\s+/g, '-') // 空格替换为短横线
    .replace(/[^\w\u4e00-\u9fa5-]/g, ''); // 移除特殊字符，保留中文、字母、数字和短横线
}

/**
 * 获取所有标签及其文章数量
 */
export async function getAllTags(locale: AppLocale = defaultLocale): Promise<Tag[]> {
  const blogs = await getLocalizedBlogs(locale);

  const tagMap = new Map<string, number>();

  blogs.forEach(blog => {
    const tags = blog.data.tags || [];
    tags.forEach((tag: string) => {
      const count = tagMap.get(tag) || 0;
      tagMap.set(tag, count + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({
      name,
      slug: tagToSlug(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 根据标签筛选博客文章
 */
export async function getBlogsByTag(tagName: string, locale: AppLocale = defaultLocale) {
  const blogs = await getLocalizedBlogs(locale);

  return blogs.filter(blog => blog.data.tags?.includes(tagName));
}

async function getLocalizedBlogs(locale: AppLocale) {
  const isDev = process.env.NODE_ENV === 'development';
  const blogs = await getCollection('blogs', ({ data }) => isDev || !data.draft);
  const fallbackBlogs = blogs.filter(blog => blog.data.lang === defaultLocale);
  const localizedBlogs = blogs.filter(blog => blog.data.lang === locale);
  const merged = new Map<string, (typeof blogs)[number]>();

  [...localizedBlogs, ...fallbackBlogs].forEach(blog => {
    if (!merged.has(blog.id)) {
      merged.set(blog.id, blog);
    }
  });

  return [...merged.values()];
}
