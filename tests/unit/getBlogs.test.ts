import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCollectionMock = vi.hoisted(() => vi.fn());

vi.mock('astro:content', () => ({
  getCollection: getCollectionMock,
}));

import { getBlogs } from '../../src/utils/getBlogs';

describe('getBlogs', () => {
  beforeEach(() => {
    getCollectionMock.mockReset();
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
});
