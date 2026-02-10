import { getCollection } from 'astro:content';

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
 * 从 slug 还原标签名称
 */
const tagSlugMap = new Map<string, string>();

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

      // 建立slug到名称的映射
      const slug = tagToSlug(tag);
      tagSlugMap.set(slug, tag);
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
 * 根据标签 slug 获取对应的标签名称
 */
export function getTagName(slug: string): string {
  return tagSlugMap.get(slug) || slug;
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
