import type { CollectionEntry } from 'astro:content';

export type IdeaEntry = CollectionEntry<'ideas'>;

export function sortByUpdatedDesc(entries: IdeaEntry[]): IdeaEntry[] {
  return [...entries].sort(
    (a, b) => b.data.updated.getTime() - a.data.updated.getTime(),
  );
}

export function getThisWeek(entries: IdeaEntry[]): IdeaEntry[] {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  return sortByUpdatedDesc(
    entries.filter(
      (e) => e.data.added >= weekAgo || e.data.updated >= weekAgo,
    ),
  );
}

export function getBacklinks(
  slug: string,
  entries: IdeaEntry[],
): IdeaEntry[] {
  return entries.filter((e) => e.data.related?.includes(slug) ?? false);
}

export function getTagCounts(entries: IdeaEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

export function getMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function getArchiveMonths(entries: IdeaEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const key = getMonthKey(entry.data.updated);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Map([...counts.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatSourceType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
