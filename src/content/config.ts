import { defineCollection, z } from 'astro:content';

const sourceSchema = z
  .object({
    type: z.enum([
      'book',
      'article',
      'paper',
      'youtube',
      'podcast',
      'conversation',
      'course',
      'other',
    ]),
    title: z.string().min(1),
    author: z.string().min(1),
    url: z.string().url().optional(),
    consumed_on: z.coerce.date(),
  })
  .strict();

const ideasSchema = z
  .object({
    title: z.string().min(3).max(120),
    summary: z.string().min(10).max(200),
    source: sourceSchema,
    takeaways: z.array(z.string()).min(2).max(7),
    tags: z
      .array(z.string().regex(/^[a-z0-9-]+$/))
      .min(1)
      .max(6),
    maturity: z.enum(['seedling', 'budding', 'evergreen']),
    added: z.coerce.date(),
    updated: z.coerce.date(),
    related: z.array(z.string()).optional(),
    quotes: z.array(z.string()).optional(),
  })
  .strict();

export const collections = {
  ideas: defineCollection({
    type: 'content',
    schema: ideasSchema,
  }),
};
