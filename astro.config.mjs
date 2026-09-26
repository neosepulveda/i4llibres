import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import externalLinks from './src/lib/external-links.mjs';

export default defineConfig({
  output: 'static',
  markdown: { processor: unified({ rehypePlugins: [[externalLinks, { site: process.env.SITE_URL }]] }) },
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || '/',
  devToolbar: { enabled: false },
});
