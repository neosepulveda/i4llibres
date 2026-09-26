import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const notices = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/notices',
  }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    category: z.enum(['classe', 'escola', 'menjador', 'calendari']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    note: z.string().optional(),
    images: z.array(z.object({
      src: z.string().startsWith('/downloads/'),
      title: z.string().min(1),
      alt: z.string().min(1),
    })).default([]),
    event: z.object({
      start: z.iso.datetime({ offset: true }),
      end: z.iso.datetime({ offset: true }),
      location: z.string().min(1),
      description: z.string().min(1),
    }).refine(event => Date.parse(event.end) > Date.parse(event.start), { message: 'Event end must be after start' }).optional(),
    order: z.number().int().nonnegative().default(100),
  }),
});

export const collections = { notices };
