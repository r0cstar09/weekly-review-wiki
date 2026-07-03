/**
 * Content guardrails beyond Zod — run via npm run validate and prebuild.
 * Prints line-referenced errors and exits non-zero on any violation.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IDEAS_DIR = join(ROOT, 'src/content/ideas');

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
    pinned: z.boolean().optional(),
    related: z.array(z.string()).optional(),
    quotes: z.array(z.string()).optional(),
  })
  .strict();

const errors = [];

function rel(path) {
  return path.replace(ROOT + '/', '');
}

function lineRef(filePath, line, message) {
  errors.push(`${rel(filePath)}:${line}: ${message}`);
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function startOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function frontmatterLine(filePath, raw, key) {
  const re = new RegExp(`^${key}:`, 'm');
  const match = raw.match(re);
  if (!match) return 1;
  return raw.slice(0, match.index).split('\n').length;
}

function validateFile(filePath, allSlugs) {
  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const slug = filePath.split('/').pop().replace(/\.md$/, '');

  const zodResult = ideasSchema.safeParse(data);
  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      const key = issue.path[0];
      const line =
        typeof key === 'string' ? frontmatterLine(filePath, raw, key) : 1;
      lineRef(filePath, line, `Schema: ${issue.path.join('.')}: ${issue.message}`);
    }
    return;
  }

  const entry = zodResult.data;
  const today = startOfToday();

  if (entry.updated < entry.added) {
    lineRef(
      filePath,
      frontmatterLine(filePath, raw, 'updated'),
      `updated (${entry.updated.toISOString()}) must be >= added (${entry.added.toISOString()})`,
    );
  }

  if (entry.added > today) {
    lineRef(
      filePath,
      frontmatterLine(filePath, raw, 'added'),
      `added (${entry.added.toISOString()}) must not be in the future`,
    );
  }

  if (entry.updated > today) {
    lineRef(
      filePath,
      frontmatterLine(filePath, raw, 'updated'),
      `updated (${entry.updated.toISOString()}) must not be in the future`,
    );
  }

  const body = content.trim();
  if (body.length < 200) {
    const bodyStart = raw.indexOf('---', raw.indexOf('---') + 3) + 4;
    const line = raw.slice(0, bodyStart).split('\n').length;
    lineRef(
      filePath,
      line,
      `Body must be at least 200 characters (got ${body.length})`,
    );
  }

  const titleNorm = normalizeText(entry.title);
  const summaryNorm = normalizeText(entry.summary);
  if (summaryNorm === titleNorm) {
    lineRef(
      filePath,
      frontmatterLine(filePath, raw, 'summary'),
      'summary must not merely repeat title',
    );
  }

  const seenTakeaways = new Set();
  entry.takeaways.forEach((takeaway, i) => {
    const trimmed = takeaway.trim();
    if (trimmed.length < 15) {
      lineRef(
        filePath,
        frontmatterLine(filePath, raw, 'takeaways'),
        `takeaway ${i + 1} must be at least 15 characters`,
      );
    }
    const norm = normalizeText(trimmed);
    if (seenTakeaways.has(norm)) {
      lineRef(
        filePath,
        frontmatterLine(filePath, raw, 'takeaways'),
        `duplicate takeaway: "${trimmed}"`,
      );
    }
    seenTakeaways.add(norm);
  });

  if (entry.related) {
    for (const relatedSlug of entry.related) {
      if (!allSlugs.has(relatedSlug)) {
        lineRef(
          filePath,
          frontmatterLine(filePath, raw, 'related'),
          `dangling related slug "${relatedSlug}" — no entry exists`,
        );
      }
      if (relatedSlug === slug) {
        lineRef(
          filePath,
          frontmatterLine(filePath, raw, 'related'),
          'entry cannot relate to itself',
        );
      }
    }
  }
}

function collectSlugs(files) {
  const slugs = new Set();
  for (const file of files) {
    slugs.add(file.replace(/\.md$/, ''));
  }
  return slugs;
}

function main() {
  if (!existsSync(IDEAS_DIR)) {
    console.error(`validate-content: directory not found: ${rel(IDEAS_DIR)}`);
    process.exit(1);
  }

  const files = readdirSync(IDEAS_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => join(IDEAS_DIR, f));

  if (files.length === 0) {
    console.error('validate-content: no idea entries found');
    process.exit(1);
  }

  const allSlugs = collectSlugs(files.map((f) => f.split('/').pop()));

  for (const filePath of files) {
    validateFile(filePath, allSlugs);
  }

  if (errors.length > 0) {
    console.error('Content validation failed:\n');
    for (const err of errors) {
      console.error(`  ✗ ${err}`);
    }
    console.error(`\n${errors.length} violation(s). Fix entries before building.`);
    process.exit(1);
  }

  console.log(`✓ ${files.length} idea(s) passed validation`);
}

main();
