import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blogs' }),
  schema: z.object({
    lang: z.literal('zh'),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    poster: z.string().optional(),
    posterDescription: z.string().optional(),
    permalink: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    featured: z.boolean().optional(),
    category: z.enum(['tech', 'note']).default('tech'),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const resume = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/resume' }),
  schema: z.object({
    // 纯 Markdown 格式，frontmatter 只需要 format 字段
    format: z.literal('markdown'),
  }),
});

const columns = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/columns' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    poster: z.string().optional(),
    status: z.enum(['ongoing', 'completed']).default('ongoing'),
    draft: z.boolean().default(false),
  }),
});

const columnArticles = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/columns' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    poster: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blogs,
  resume,
  columns,
  columnArticles,
};
