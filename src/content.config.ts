import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blogs' }),
  schema: z.object({
    lang: z.enum(['zh', 'en']),
    layout: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    poster: z.string().optional(),
    posterDescription: z.string().optional(),
    permalink: z.string(),
    createdAt: z.string(),
    category: z.enum(['tech', 'note']),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  blogs,
};
