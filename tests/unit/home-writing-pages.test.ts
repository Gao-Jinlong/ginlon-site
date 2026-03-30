import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getBlogsMock = vi.hoisted(() => vi.fn());
const getAllTagsMock = vi.hoisted(() => vi.fn());

vi.mock('../../src/utils/getBlogs', () => ({
  getBlogs: getBlogsMock,
}));

vi.mock('../../src/utils/getTags', () => ({
  getAllTags: getAllTagsMock,
}));

const sampleBlogs = [
  {
    slug: 'first-post',
    title: '第一篇文章',
    summary: '第一篇摘要',
    publishedAt: '2025-01-02 00:00:00 +08:00',
    tags: ['工程'],
    data: {
      title: '第一篇文章',
      permalink: 'first-post',
      createdAt: '2025-01-02 00:00:00 +08:00',
      summary: '第一篇摘要',
      subtitle: '第一篇摘要',
      tags: ['工程'],
      category: 'tech',
    },
  },
  {
    slug: 'second-post',
    title: '第二篇文章',
    summary: '第二篇摘要',
    publishedAt: '2024-12-10 00:00:00 +08:00',
    tags: ['阅读'],
    data: {
      title: '第二篇文章',
      permalink: 'second-post',
      createdAt: '2024-12-10 00:00:00 +08:00',
      summary: '第二篇摘要',
      subtitle: '第二篇摘要',
      tags: ['阅读'],
      category: 'note',
    },
  },
];

const sampleTags = [
  { name: '工程', slug: '工程', count: 1 },
  { name: '阅读', slug: '阅读', count: 1 },
];

async function renderHome(pathname = '/') {
  const container = await AstroContainer.create();
  const page = await import('../../src/pages/index.astro');

  return container.renderToString(page.default, {
    request: new Request(`https://www.ginlon.site${pathname}`),
  });
}

async function renderWriting(pathname = '/writing') {
  const container = await AstroContainer.create();
  const page = await import('../../src/pages/writing/index.astro');

  return container.renderToString(page.default, {
    request: new Request(`https://www.ginlon.site${pathname}`),
  });
}

describe('home and writing pages', () => {
  beforeEach(() => {
    getBlogsMock.mockReset();
    getAllTagsMock.mockReset();
    getBlogsMock.mockResolvedValue(sampleBlogs);
    getAllTagsMock.mockResolvedValue(sampleTags);
  });

  it('renders home as writing-first landing page without legacy tab panels', async () => {
    const homeHtml = await renderHome('/');

    expect(homeHtml).toContain('写作');
    expect(homeHtml).not.toContain('tab-panel');
    expect(homeHtml).not.toContain('Selected Writing');
    expect(homeHtml).not.toContain('Current Focus');
    expect(homeHtml).not.toContain('About');
  });

  it('renders writing archive with all-articles heading', async () => {
    const writingHtml = await renderWriting('/writing');

    expect(writingHtml).toContain('全部文章');
    expect(writingHtml).toContain('第一篇文章');
    expect(writingHtml).not.toContain('Writing Archive');
  });

  it('filters writing archive by tag query', async () => {
    const writingHtml = await renderWriting('/writing?tag=工程');

    // 客户端筛选：所有文章都渲染在 HTML 中，但通过 data-tags 属性和 hidden 属性控制显示
    expect(writingHtml).toContain('第一篇文章');
    expect(writingHtml).toContain('第二篇文章');
    
    // 检查文章卡片的 data-tags 属性是否正确设置
    expect(writingHtml).toContain('data-tags="工程"');
    expect(writingHtml).toContain('data-tags="阅读"');
    
    // 检查当前选中的标签在 URL 中高亮
    expect(writingHtml).toContain('tag-link-active');
  });

  it('keeps legacy archive and tags routes as redirects to writing', () => {
    const blogsIndexSource = readFileSync(resolve(process.cwd(), 'src/pages/blogs/index.astro'), 'utf8');
    const tagsIndexSource = readFileSync(resolve(process.cwd(), 'src/pages/tags/index.astro'), 'utf8');
    const tagPageSource = readFileSync(
      resolve(process.cwd(), 'src/pages/tags/[tag].astro'),
      'utf8',
    );

    expect(blogsIndexSource).toContain("Astro.redirect('/writing')");
    expect(tagsIndexSource).toContain("Astro.redirect('/writing')");
    expect(tagPageSource).toContain('Astro.redirect');
    expect(tagPageSource).toContain('/writing?tag=');
  });
});
