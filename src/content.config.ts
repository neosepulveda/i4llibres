import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { sceneNames } from './lib/scenes';

const notices = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/notices',
  }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    category: z.enum(['classe', 'escola', 'menjador', 'afa']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    note: z.string().optional(),
    scene: z.enum(sceneNames).optional(),
    expanded: z.boolean().default(false),
    images: z.array(z.object({
      src: z.string().startsWith('/downloads/'),
      title: z.string().min(1),
      alt: z.string().min(1),
    })).default([]),
    event: z.intersection(z.discriminatedUnion('allDay', [
      z.object({ allDay: z.literal(true), start: z.iso.date(), end: z.iso.date() }),
      z.object({ allDay: z.literal(false).optional(), start: z.iso.datetime({ offset: true }), end: z.iso.datetime({ offset: true }) }),
    ]), z.object({
      title: z.string().min(1).optional(),
      location: z.string().min(1),
      description: z.string().min(1),
    })).refine(event => Date.parse(event.end) > Date.parse(event.start), { message: 'Event end must be after start' }).optional(),
    order: z.number().int().nonnegative().default(100),
  }),
});

const translations = defineCollection({
  loader: glob({ pattern:'**/*.md', base:'./src/content/translations' }),
  schema: z.object({
    title:z.string().min(1), description:z.string().min(1), note:z.string().min(1),
    event:z.object({title:z.string().min(1),location:z.string().min(1),description:z.string().min(1)}).optional(),
    images:z.array(z.object({title:z.string().min(1),alt:z.string().min(1)})).optional(),
  }),
});
export const collections = { notices, translations };
