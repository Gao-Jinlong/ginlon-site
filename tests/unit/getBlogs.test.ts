import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCollectionMock = vi.hoisted(() => vi.fn());
const statSyncMock = vi.hoisted(() => vi.fn());

vi.mock('astro:content', () => ({
  getCollection: getCollectionMock,
}));

vi.mock('node:fs', () => ({
  default: {
    statSync: statSyncMock,
  },
}));

import { getBlogs } from '../../src/utils/getBlogs';

describe('getBlogs', () => {
  beforeEach(() => {
    getCollectionMock.mockReset();
    statSyncMock.mockReset();
    process.env.NODE_ENV = 'test';
  });

  it('returns published zh blogs in reverse-chronological order with normalized fields', async () => {
    getCollectionMock.mockImplementation(async (_name: string, filter: (entry: any) => boolean) =>
      [
        {
          id: 'zh/new',
          slug: 'new',
          data: {
            lang: 'zh',
            title: '新文章',
            description: '新的摘要',
            subtitle: '备用摘要',
            createdAt: '2025-01-02 00:00:00 +08:00',
            permalink: 'new',
            category: 'tech',
            tags: ['TypeScript', '前端'],
          },
        },
        {
          id: 'zh/old',
          slug: 'old',
          data: {
            lang: 'zh',
            title: '旧文章',
            subtitle: '旧的摘要',
            createdAt: '2024-01-02 00:00:00 +08:00',
            permalink: 'old',
            category: 'note',
            tags: ['读书'],
          },
        },
        {
          id: 'zh/draft',
          slug: 'draft',
          data: {
            lang: 'zh',
            title: '草稿',
            createdAt: '2026-01-02 00:00:00 +08:00',
            permalink: 'draft',
            category: 'tech',
            draft: true,
          },
        },
      ].filter(filter),
    );

    const blogs = await getBlogs('zh');

    expect(blogs).toHaveLength(2);
    expect(blogs.map((blog) => blog.slug)).toEqual(['new', 'old']);
    expect(blogs[0]).toMatchObject({
      slug: 'new',
      title: '新文章',
      summary: '新的摘要',
      publishedAt: '2025-01-02 00:00:00 +08:00',
      tags: ['TypeScript', '前端'],
      data: {
        title: '新文章',
      },
    });
    expect(blogs[1]).toMatchObject({
      slug: 'old',
      title: '旧文章',
      summary: '旧的摘要',
      publishedAt: '2024-01-02 00:00:00 +08:00',
    });
  });

  it('keeps backward-compatible lastModified by falling back to file mtime when updatedAt is missing', async () => {
    const mtime = new Date('2026-01-02T03:04:05.000Z');
    statSyncMock.mockReturnValue({ mtime });

    getCollectionMock.mockImplementation(async (_name: string, filter: (entry: any) => boolean) =>
      [
        {
          id: 'zh/legacy',
          slug: 'legacy',
          filePath: 'src/content/blogs/zh/legacy/index.mdx',
          data: {
            lang: 'zh',
            title: '兼容文章',
            createdAt: '2025-01-02 00:00:00 +08:00',
            permalink: 'legacy',
            category: 'tech',
            tags: [],
          },
        },
      ].filter(filter),
    );

    const blogs = await getBlogs('zh');

    expect(blogs).toHaveLength(1);
    const firstBlog = blogs[0];
    expect(firstBlog).toBeDefined();
    expect(firstBlog!.data.lastModified).toBe('2026-01-02T03:04:05.000Z');
  });

  it('returns a non-empty summary when description is missing and subtitle is blank', async () => {
    getCollectionMock.mockImplementation(async (_name: string, filter: (entry: any) => boolean) =>
      [
        {
          id: 'zh/body-summary',
          slug: 'body-summary',
          body: '# 标题\n\n这是正文第一段，用于摘要兜底。\n\n## 第二节\n更多内容',
          data: {
            lang: 'zh',
            title: '正文兜底文章',
            subtitle: '   ',
            createdAt: '2025-03-02 00:00:00 +08:00',
            permalink: 'body-summary',
            category: 'note',
            tags: [],
          },
        },
      ].filter(filter),
    );

    const blogs = await getBlogs('zh');

    expect(blogs).toHaveLength(1);
    expect(blogs[0]).toBeDefined();
    expect(blogs[0]!.summary.trim().length).toBeGreaterThan(0);
  });
});
