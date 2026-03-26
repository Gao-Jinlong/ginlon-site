import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/utils/getTags', () => ({
  getAllTags: vi.fn(async (locale: 'zh' | 'en') => {
    if (locale === 'en') {
      return [{ name: 'Frontend', slug: 'frontend', count: 2 }];
    }

    return [{ name: '前端工程', slug: '前端工程', count: 3 }];
  }),
}));

import { getTagStaticPaths } from '../../src/utils/tagStaticPaths';

describe('getTagStaticPaths', () => {
  it('builds english tag routes with slug params and original tag names', async () => {
    await expect(getTagStaticPaths('en')).resolves.toEqual([
      {
        params: { tag: 'frontend' },
        props: { tagName: 'Frontend' },
      },
    ]);
  });
});
