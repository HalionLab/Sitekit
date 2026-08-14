import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { ContentSource, Page, Post, SitemapEntry } from '@/lib/content/types';

type SubDir = 'posts' | 'pages';

interface RawFrontmatter {
  slug?: string;
  title?: string;
  excerpt?: string;
  coverImage?: string;
  coverImageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  status?: string;
  publishedAt?: string;
  updatedAt?: string;
}

interface FileRecord {
  filePath: string;
  slug: string;
  raw: RawFrontmatter;
  content: string;
  mtime: Date;
}

// Parsed { posts, pages } per rootDir. Only populated/read when
// NODE_ENV === 'production' -- in dev we always re-read from disk so
// content edits hot-reload without a server restart.
const cache = new Map<string, { posts: FileRecord[]; pages: FileRecord[] }>();

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function isEnoent(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as NodeJS.ErrnoException).code === 'ENOENT';
}

/** Relative, forward-slash path used to label errors, e.g. "content/posts/x.md". */
function fileLabel(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

/**
 * Read every `*.md` file in `dir` and extract raw (unvalidated) frontmatter.
 * Never throws on a file's content -- only on real I/O errors -- so that
 * bulk operations can decide file-by-file whether an invalid entry should
 * be skipped or should fail the whole request. A missing directory (e.g. a
 * blogless site that deleted `content/posts/`) yields an empty list rather
 * than an error.
 */
async function readDirRecords(dir: string): Promise<FileRecord[]> {
  let filenames: string[];
  try {
    filenames = (await fs.readdir(dir)).filter(f => f.endsWith('.md'));
  } catch (err) {
    if (isEnoent(err)) return [];
    throw err;
  }
  return Promise.all(
    filenames.map(async filename => {
      const filePath = path.join(dir, filename);
      const [raw, stat] = await Promise.all([fs.readFile(filePath, 'utf8'), fs.stat(filePath)]);
      const parsed = matter(raw);
      const fm = parsed.data as RawFrontmatter;
      const slug = (fm.slug && fm.slug.trim()) || path.basename(filename, '.md');
      return { filePath, slug, raw: fm, content: parsed.content.trim(), mtime: stat.mtime };
    })
  );
}

async function getAllRecords(rootDir: string): Promise<{ posts: FileRecord[]; pages: FileRecord[] }> {
  const prod = isProduction();
  if (prod && cache.has(rootDir)) return cache.get(rootDir)!;
  const [posts, pages] = await Promise.all([
    readDirRecords(path.join(rootDir, 'posts')),
    readDirRecords(path.join(rootDir, 'pages')),
  ]);
  const result = { posts, pages };
  if (prod) cache.set(rootDir, result);
  return result;
}

async function getRecords(rootDir: string, subdir: SubDir): Promise<FileRecord[]> {
  const all = await getAllRecords(rootDir);
  return all[subdir];
}

function isDraft(record: FileRecord): boolean {
  return record.raw.status === 'draft';
}

function normalizeDate(value: string, label: string, field: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`${label}: invalid "${field}" date "${value}"`);
  }
  return d.toISOString();
}

/**
 * Build a validated Post/Page from a raw record. Throws
 * `<file label>: <problem>` when required fields are missing or
 * inconsistent -- callers resolving a single slug let this propagate;
 * callers building bulk lists (see `tryBuildPost`) catch and skip instead.
 */
function buildPost(record: FileRecord): Post {
  const label = fileLabel(record.filePath);
  const fm = record.raw;

  if (!fm.title || !fm.title.trim()) {
    throw new Error(`${label}: missing required "title" frontmatter field`);
  }
  if (fm.coverImage && !fm.coverImageAlt) {
    throw new Error(`${label}: "coverImage" requires "coverImageAlt"`);
  }

  const status: 'draft' | 'published' = isDraft(record) ? 'draft' : 'published';
  const publishedAt = fm.publishedAt ? normalizeDate(fm.publishedAt, label, 'publishedAt') : null;
  const updatedAt = fm.updatedAt
    ? normalizeDate(fm.updatedAt, label, 'updatedAt')
    : (publishedAt ?? record.mtime.toISOString());

  return {
    slug: record.slug,
    title: fm.title.trim(),
    bodyMarkdown: record.content,
    excerpt: fm.excerpt ?? null,
    coverImage: fm.coverImage ?? null,
    coverImageAlt: fm.coverImageAlt ?? null,
    metaTitle: fm.metaTitle ?? null,
    metaDescription: fm.metaDescription ?? null,
    ogImage: fm.ogImage ?? null,
    status,
    publishedAt,
    updatedAt,
  };
}

/** Bulk-list variant of `buildPost`: logs and skips a file that fails validation instead of failing the whole list. */
function tryBuildPost(record: FileRecord): Post | null {
  try {
    return buildPost(record);
  } catch (err) {
    console.warn(`[content] skipping invalid file: ${(err as Error).message}`);
    return null;
  }
}

function sortKey(p: Post): number {
  return new Date(p.publishedAt ?? p.updatedAt).getTime();
}

async function listPublished(rootDir: string, subdir: SubDir): Promise<Post[]> {
  const records = await getRecords(rootDir, subdir);
  return records
    .filter(r => !isDraft(r))
    .map(tryBuildPost)
    .filter((p): p is Post => p !== null);
}

async function findRecord(rootDir: string, subdir: SubDir, slug: string): Promise<FileRecord | undefined> {
  const records = await getRecords(rootDir, subdir);
  return records.find(r => r.slug === slug);
}

async function getOne(rootDir: string, subdir: SubDir, slug: string, includeDrafts: boolean): Promise<Post | null> {
  const record = await findRecord(rootDir, subdir, slug);
  if (!record) return null;
  if (!includeDrafts && isDraft(record)) return null;
  return buildPost(record);
}

/**
 * Markdown-file-backed ContentSource. Reads `posts/*.md` and `pages/*.md`
 * under `rootDir` (default: `<cwd>/content`) via gray-matter frontmatter.
 * Slug = filename minus `.md`, overridable with a `slug:` frontmatter key.
 */
export function createFileSource(rootDir: string = path.join(process.cwd(), 'content')): ContentSource {
  return {
    async listPosts(): Promise<Post[]> {
      const posts = await listPublished(rootDir, 'posts');
      return posts.sort((a, b) => sortKey(b) - sortKey(a));
    },

    async getPost(slug: string): Promise<Post | null> {
      return getOne(rootDir, 'posts', slug, false);
    },

    async getPostIncludingDrafts(slug: string): Promise<Post | null> {
      return getOne(rootDir, 'posts', slug, true);
    },

    async listPageSlugs(): Promise<string[]> {
      const pages = await listPublished(rootDir, 'pages');
      return pages.map(p => p.slug);
    },

    async getPage(slug: string): Promise<Page | null> {
      return getOne(rootDir, 'pages', slug, false);
    },

    async getPageIncludingDrafts(slug: string): Promise<Page | null> {
      return getOne(rootDir, 'pages', slug, true);
    },

    async sitemapEntries(): Promise<SitemapEntry[]> {
      const [posts, pages] = await Promise.all([
        listPublished(rootDir, 'posts'),
        listPublished(rootDir, 'pages'),
      ]);
      return [
        ...posts.map(p => ({ kind: 'post' as const, slug: p.slug, updatedAt: p.updatedAt })),
        ...pages.map(p => ({ kind: 'page' as const, slug: p.slug, updatedAt: p.updatedAt })),
      ];
    },
  };
}
