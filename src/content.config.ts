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
    category: z.enum(['tech', 'note']),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  blogs,
};
