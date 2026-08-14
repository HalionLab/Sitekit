import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { createFileSource } from '@/lib/content/sources/file';
import { createSupabaseSource } from '@/lib/content/sources/supabase';
import type { Post } from '@/lib/content/types';

/**
 * Canned `content_items` rows equivalent to `tests/unit/fixtures/content`
 * (see `content-source-file.test.ts`). `malformed.md` has no counterpart:
 * a Supabase row can't be malformed the same way a hand-edited markdown file
 * can, so there's nothing to mirror -- see the supabase source's own
 * `content-source-file` parity note in the task brief.
 */
const { mockClient } = vi.hoisted(() => {
  interface Row {
    id: string;
    kind: 'post' | 'page';
    slug: string;
    title: string;
    body_markdown: string;
    excerpt: string | null;
    cover_image_path: string | null;
    cover_image_alt: string | null;
    meta_title: string | null;
    meta_description: string | null;
    og_image_path: string | null;
    jsonld_overrides: Record<string, unknown>;
    status: 'draft' | 'published';
    published_at: string | null;
    created_at: string;
    updated_at: string;
  }

  const rows: Row[] = [
    {
      id: '1',
      kind: 'post',
      slug: 'newer-post',
      title: 'Newer post',
      body_markdown: 'Body of the newer post.',
      excerpt: 'The most recent fixture post.',
      cover_image_path: null,
      cover_image_alt: null,
      meta_title: null,
      meta_description: null,
      og_image_path: null,
      jsonld_overrides: {},
      status: 'published',
      published_at: '2026-08-01T00:00:00.000Z',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z',
    },
    {
      id: '2',
      kind: 'post',
      slug: 'older-post',
      title: 'Older post',
      body_markdown: 'Body of the older post.',
      excerpt: 'An earlier fixture post.',
      cover_image_path: null,
      cover_image_alt: null,
      meta_title: null,
      meta_description: null,
      og_image_path: null,
      jsonld_overrides: {},
      status: 'published',
      published_at: '2026-07-01T00:00:00.000Z',
      created_at: '2026-07-01T00:00:00.000Z',
      updated_at: '2026-07-01T00:00:00.000Z',
    },
    {
      id: '3',
      kind: 'post',
      slug: 'draft-post',
      title: 'Draft post',
      body_markdown: 'Body of the draft post, not yet published.',
      excerpt: null,
      cover_image_path: null,
      cover_image_alt: null,
      meta_title: null,
      meta_description: null,
      og_image_path: null,
      jsonld_overrides: {},
      status: 'draft',
      published_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '4',
      kind: 'page',
      slug: 'about',
      title: 'About',
      body_markdown: 'Body of the fixture about page.',
      excerpt: 'Fixture about page.',
      cover_image_path: null,
      cover_image_alt: null,
      meta_title: null,
      meta_description: null,
      og_image_path: null,
      jsonld_overrides: {},
      status: 'published',
      published_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  // Minimal fake of the Supabase query-builder chain used by
  // lib/content/queries.ts: .from(table).select(...).eq(...).order(...),
  // terminated either by `await` (the builder is thenable) or `.maybeSingle()`.
  function makeClient() {
    return {
      from() {
        let filtered = [...rows];
        let orderField: string | null = null;
        let orderAscending = true;

        function sorted(): Row[] {
          if (!orderField) return filtered;
          const field = orderField;
          return [...filtered].sort((a, b) => {
            const av = (a as unknown as Record<string, string | null>)[field] ?? '';
            const bv = (b as unknown as Record<string, string | null>)[field] ?? '';
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return orderAscending ? cmp : -cmp;
          });
        }

        const builder = {
          select() {
            return builder;
          },
          eq(field: string, value: unknown) {
            filtered = filtered.filter(r => (r as unknown as Record<string, unknown>)[field] === value);
            return builder;
          },
          order(field: string, opts?: { ascending?: boolean }) {
            orderField = field;
            orderAscending = opts?.ascending ?? true;
            return builder;
          },
          maybeSingle() {
            return Promise.resolve({ data: sorted()[0] ?? null, error: null });
          },
          then(resolve: (value: { data: Row[]; error: null }) => unknown, reject?: (reason: unknown) => unknown) {
            return Promise.resolve({ data: sorted(), error: null }).then(resolve, reject);
          },
        };
        return builder;
      },
    };
  }

  return { mockClient: makeClient() };
});

vi.mock('@/lib/supabase/public', () => ({ createPublicClient: () => mockClient }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => mockClient }));

const fileSource = createFileSource(path.join(__dirname, 'fixtures/content'));
const supabaseSource = createSupabaseSource();

function zeroUpdatedAt(posts: Post[]): Post[] {
  return posts.map(p => ({ ...p, updatedAt: '' }));
}

describe('content source parity: file vs supabase', () => {
  it('listPosts returns the same slugs, order, and shape', async () => {
    const [filePosts, sbPosts] = await Promise.all([fileSource.listPosts(), supabaseSource.listPosts()]);
    expect(filePosts.map(p => p.slug)).toEqual(['newer-post', 'older-post']);
    expect(zeroUpdatedAt(filePosts)).toEqual(zeroUpdatedAt(sbPosts));
  });

  it('getPost returns null for a missing slug on both sources', async () => {
    expect(await fileSource.getPost('does-not-exist')).toBeNull();
    expect(await supabaseSource.getPost('does-not-exist')).toBeNull();
  });

  it('getPost returns null for a draft on both sources', async () => {
    expect(await fileSource.getPost('draft-post')).toBeNull();
    expect(await supabaseSource.getPost('draft-post')).toBeNull();
  });

  it('getPostIncludingDrafts returns the draft on both sources', async () => {
    expect((await fileSource.getPostIncludingDrafts('draft-post'))?.status).toBe('draft');
    expect((await supabaseSource.getPostIncludingDrafts('draft-post'))?.status).toBe('draft');
  });

  it('getPage returns the same shape (ignoring updatedAt) on both sources', async () => {
    const [filePage, sbPage] = await Promise.all([fileSource.getPage('about'), supabaseSource.getPage('about')]);
    expect(filePage).not.toBeNull();
    expect({ ...filePage, updatedAt: '' }).toEqual({ ...sbPage, updatedAt: '' });
  });

  it('file source has no getJsonldOverrides; supabase source resolves it', async () => {
    expect(fileSource.getJsonldOverrides).toBeUndefined();
    expect(await supabaseSource.getJsonldOverrides?.('newer-post')).toEqual({});
    expect(await supabaseSource.getJsonldOverrides?.('does-not-exist')).toEqual({});
  });
});
