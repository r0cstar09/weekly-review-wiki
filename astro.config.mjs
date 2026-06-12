import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
