import { beforeEach, describe, expect, it, vi } from 'vitest';

const getBlogsMock = vi.hoisted(() => vi.fn());
const getCollectionMock = vi.hoisted(() => vi.fn(() => {
  throw new Error('getCollection should not be used by getTags');
}));

vi.mock('../../src/utils/getBlogs', () => ({
  getBlogs: getBlogsMock,
}));

vi.mock('astro:content', () => ({
  getCollection: getCollectionMock,
}));

import { getAllTags, getBlogsByTag, tagToSlug } from '../../src/utils/getTags';

describe('getTags helpers', () => {
  beforeEach(() => {
    getBlogsMock.mockReset();
    getCollectionMock.mockClear();
  });

  it('builds tag counters from normalized blogs', async () => {
    getBlogsMock.mockResolvedValue([
      {
        slug: 'a',
        tags: ['TypeScript', '前端'],
      },
      {
        slug: 'b',
        tags: ['TypeScript'],
      },
      {
        slug: 'c',
        tags: [],
      },
    ]);

    const tags = await getAllTags('zh');

    expect(tags).toEqual([
      {
        name: 'TypeScript',
        slug: 'typescript',
        count: 2,
      },
      {
        name: '前端',
        slug: '前端',
        count: 1,
      },
    ]);
    expect(getBlogsMock).toHaveBeenCalledWith('zh');
  });

  it('filters normalized blogs by exact tag name', async () => {
    getBlogsMock.mockResolvedValue([
      {
        slug: 'a',
        tags: ['TypeScript', '前端'],
      },
      {
        slug: 'b',
        tags: ['读书'],
      },
    ]);

    const blogs = await getBlogsByTag('前端', 'zh');

    expect(blogs.map((blog: { slug: string }) => blog.slug)).toEqual(['a']);
    expect(getBlogsMock).toHaveBeenCalledWith('zh');
  });

  it('keeps chinese characters while slugifying tags', () => {
    expect(tagToSlug('前端 工程')).toBe('前端-工程');
    expect(tagToSlug('C++ / Guide')).toBe('c--guide');
  });
});
