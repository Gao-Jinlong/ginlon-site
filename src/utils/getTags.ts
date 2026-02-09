import { getCollection } from 'astro:content';

export interface Tag {
  name: string;
  slug: string;
  count: number;
}

/**
 * 获取所有标签及其文章数量
 */
export async function getAllTags(): Promise<Tag[]> {
  const blogs = await getCollection('blogs', ({ data }) => {
    const isDev = process.env.NODE_ENV === 'development';
    return isDev || !data.draft;
  });

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
      slug: encodeURIComponent(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 根据标签 slug 获取对应的标签名称
 */
export function getTagName(slug: string): string {
  return decodeURIComponent(slug);
}

/**
 * 根据标签筛选博客文章
 */
export async function getBlogsByTag(tagName: string) {
  const blogs = await getCollection('blogs', ({ data }) => {
    const isDev = process.env.NODE_ENV === 'development';
    const isDraft = data.draft;
    const hasTag = data.tags?.includes(tagName);
    return (isDev || !isDraft) && hasTag;
  });

  return blogs;
}
