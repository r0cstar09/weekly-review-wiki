import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '@/site.config';
import { sortByUpdatedDesc } from '@/lib/ideas';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const ideas = sortByUpdatedDesc(await getCollection('ideas'));

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: ideas.map((idea) => ({
      title: idea.data.title,
      pubDate: idea.data.added,
      description: idea.data.summary,
      link: `/ideas/${idea.slug}/`,
    })),
  });
};
