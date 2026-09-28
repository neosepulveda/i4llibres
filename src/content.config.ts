import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { sceneNames } from './lib/scenes';
import { menuKinds } from './lib/menus';

// Downloads keep lowercase ASCII names with hyphens, so links and saved files need no escaping.
const download = z.string().regex(/^\/downloads\/[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+$/, 'Name downloads like /downloads/menjador-pla-2026-2027.pdf');

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
      src: download,
      title: z.string().min(1),
      alt: z.string().min(1),
    })).default([]),
    files: z.array(z.object({ src: download, title: z.string().min(1) })).default([]),
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
    files:z.array(z.object({title:z.string().min(1)})).optional(),
  }),
});
// One file per month, named after it. The pictures live in public/downloads as
// menjador-<kind>-<month>.jpg; the list says which ones arrived, in the order families see them.
const menus = defineCollection({
  loader: glob({ pattern:'*.yaml', base:'./src/content/menus' }),
  schema: z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Write the month as YYYY-MM'),
    menus: z.array(z.enum(menuKinds)).min(1).refine(kinds => new Set(kinds).size === kinds.length, 'List each menu once'),
  }),
});
export const collections = { notices, translations, menus };
