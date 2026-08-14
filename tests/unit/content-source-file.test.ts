import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { createFileSource } from '@/lib/content/sources/file';

const src = createFileSource(path.join(__dirname, 'fixtures/content'));

describe('file content source', () => {
  it('lists only published posts, newest first', async () => {
    const posts = await src.listPosts();
    expect(posts.map(p => p.slug)).toEqual(['newer-post', 'older-post']); // draft-post excluded
  });
  it('getPost returns null for drafts', async () => {
    expect(await src.getPost('draft-post')).toBeNull();
  });
  it('getPostIncludingDrafts returns drafts', async () => {
    expect((await src.getPostIncludingDrafts('draft-post'))?.status).toBe('draft');
  });
  it('derives slug from filename and parses frontmatter', async () => {
    const p = await src.getPost('newer-post');
    expect(p?.title).toBe('Newer post');
    expect(p?.publishedAt).toMatch(/^\d{4}-/);
  });
  it('throws a readable error on malformed frontmatter', async () => {
    await expect(src.getPostIncludingDrafts('malformed')).rejects.toThrow(/malformed\.md/);
  });
  it('returns null for a missing slug', async () => {
    expect(await src.getPost('nope')).toBeNull();
  });
  it('sitemapEntries covers published posts and pages', async () => {
    const e = await src.sitemapEntries();
    expect(e).toContainEqual(expect.objectContaining({ kind: 'page', slug: 'about' }));
    expect(e.find(x => x.slug === 'draft-post')).toBeUndefined();
  });
});
