import { describe, it, expect } from 'vitest';
import { deriveSlug, validateContentInput } from '@/lib/admin/content';

// ---------------------------------------------------------------------------
// deriveSlug
// ---------------------------------------------------------------------------

describe('deriveSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(deriveSlug('Hello World')).toBe('hello-world');
  });

  it('collapses multiple whitespace/punctuation runs into one hyphen', () => {
    expect(deriveSlug('Hello,  World!  2026')).toBe('hello-world-2026');
  });

  it('matches the spec example', () => {
    expect(deriveSlug('Hello, World! 2026')).toBe('hello-world-2026');
  });

  it('strips leading and trailing hyphens', () => {
    expect(deriveSlug('  ---hello---  ')).toBe('hello');
  });

  it('handles punctuation-only strings by returning empty string', () => {
    expect(deriveSlug('!!!')).toBe('');
  });

  it('handles empty string', () => {
    expect(deriveSlug('')).toBe('');
  });

  it('strips non-ASCII-alphanumeric unicode chars into hyphens', () => {
    // é, ñ etc are not [a-z0-9] after lowercasing, so they collapse into
    // the surrounding non-alphanumeric run and become a single hyphen.
    expect(deriveSlug('café au lait')).toBe('caf-au-lait');
  });

  it('preserves numbers', () => {
    expect(deriveSlug('Top 10 Tips')).toBe('top-10-tips');
  });

  it('does not produce double hyphens', () => {
    expect(deriveSlug('foo -- bar')).toBe('foo-bar');
  });

  it('passes through an already-valid slug unchanged', () => {
    expect(deriveSlug('my-slug-2026')).toBe('my-slug-2026');
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set('id', '');
  fd.set('kind', 'post');
  fd.set('title', 'My Great Post');
  fd.set('slug', 'my-great-post');
  fd.set('excerpt', '');
  fd.set('body_markdown', '');
  fd.set('meta_title', '');
  fd.set('meta_description', '');
  fd.set('cover_image_path', '');
  fd.set('cover_image_alt', '');
  fd.set('intent', 'draft');
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

// ---------------------------------------------------------------------------
// validateContentInput — happy path
// ---------------------------------------------------------------------------

describe('validateContentInput — happy path', () => {
  it('returns ok:true for a minimal valid new-post draft', () => {
    const result = validateContentInput(validFormData());
    expect(result.ok).toBe(true);
  });

  it('returns id:null when id field is empty string', () => {
    const result = validateContentInput(validFormData({ id: '' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.id).toBeNull();
  });

  it('returns id as string when id is a non-empty UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = validateContentInput(validFormData({ id: uuid }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.id).toBe(uuid);
  });

  it('accepts kind:page', () => {
    const result = validateContentInput(validFormData({ kind: 'page', slug: 'about' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.kind).toBe('page');
  });

  it('accepts intent:publish', () => {
    const result = validateContentInput(validFormData({ intent: 'publish' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.intent).toBe('publish');
  });

  it('accepts intent:unpublish', () => {
    const result = validateContentInput(validFormData({ intent: 'unpublish' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.intent).toBe('unpublish');
  });

  it('normalizes empty optional fields to null', () => {
    const result = validateContentInput(validFormData());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.excerpt).toBeNull();
      expect(result.data.meta_title).toBeNull();
      expect(result.data.meta_description).toBeNull();
      expect(result.data.cover_image_path).toBeNull();
      expect(result.data.cover_image_alt).toBeNull();
    }
  });

  it('preserves non-empty optional fields', () => {
    const result = validateContentInput(
      validFormData({
        excerpt: 'A short excerpt',
        meta_title: 'SEO Title',
        meta_description: 'SEO desc',
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.excerpt).toBe('A short excerpt');
      expect(result.data.meta_title).toBe('SEO Title');
      expect(result.data.meta_description).toBe('SEO desc');
    }
  });

  it('allows body_markdown to be empty string', () => {
    const result = validateContentInput(validFormData({ body_markdown: '' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.body_markdown).toBe('');
  });

  it('passes the cover-alt rule when both path and alt are set', () => {
    const result = validateContentInput(
      validFormData({
        cover_image_path: 'media/hero.jpg',
        cover_image_alt: 'A green hill',
      }),
    );
    expect(result.ok).toBe(true);
  });

  it('passes when neither cover_image_path nor cover_image_alt is set', () => {
    const result = validateContentInput(
      validFormData({ cover_image_path: '', cover_image_alt: '' }),
    );
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateContentInput — title validation
// ---------------------------------------------------------------------------

describe('validateContentInput — title validation', () => {
  it('rejects empty title', () => {
    const result = validateContentInput(validFormData({ title: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title/i);
  });

  it('rejects whitespace-only title', () => {
    const result = validateContentInput(validFormData({ title: '   ' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title/i);
  });
});

// ---------------------------------------------------------------------------
// validateContentInput — slug format validation
// ---------------------------------------------------------------------------

describe('validateContentInput — slug validation', () => {
  it('rejects empty slug', () => {
    const result = validateContentInput(validFormData({ slug: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/slug/i);
  });

  it('rejects slug with uppercase letters', () => {
    const result = validateContentInput(validFormData({ slug: 'My-Post' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/slug/i);
  });

  it('rejects slug with leading hyphen', () => {
    const result = validateContentInput(validFormData({ slug: '-my-post' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/slug/i);
  });

  it('rejects slug with trailing hyphen', () => {
    const result = validateContentInput(validFormData({ slug: 'my-post-' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/slug/i);
  });

  it('rejects slug with consecutive hyphens', () => {
    const result = validateContentInput(validFormData({ slug: 'my--post' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/slug/i);
  });

  it('rejects slug with spaces', () => {
    const result = validateContentInput(validFormData({ slug: 'my post' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/slug/i);
  });

  it('accepts slug with numbers', () => {
    const result = validateContentInput(validFormData({ slug: 'top-10-tips' }));
    expect(result.ok).toBe(true);
  });

  it('accepts single-word slug', () => {
    const result = validateContentInput(validFormData({ slug: 'about' }));
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateContentInput — reserved slug rejection
// Validation imports RESERVED_SLUGS from lib/content/reserved-slugs.ts so
// the two sources can never drift.
// ---------------------------------------------------------------------------

describe('validateContentInput — reserved slug rejection', () => {
  // Test a representative subset; the set itself is the single source of truth.
  const formatValidReserved = [
    'blog',
    'admin',
    'api',
    'auth',
    'login',
    'unsubscribe',
    'opengraph-image',
  ];
  for (const slug of formatValidReserved) {
    it(`rejects reserved slug "${slug}"`, () => {
      const result = validateContentInput(validFormData({ slug }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/reserved/i);
    });
  }

  it('rejects "llms.txt" (dot makes it invalid format — still rejected)', () => {
    // llms.txt contains a dot so slug_format rejects it before reserved check.
    // Either way it must never pass.
    const result = validateContentInput(validFormData({ slug: 'llms.txt' }));
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateContentInput — kind enum validation
// ---------------------------------------------------------------------------

describe('validateContentInput — kind validation', () => {
  it('rejects unknown kind', () => {
    const result = validateContentInput(validFormData({ kind: 'article' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/kind/i);
  });

  it('rejects empty kind', () => {
    const result = validateContentInput(validFormData({ kind: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/kind/i);
  });
});

// ---------------------------------------------------------------------------
// validateContentInput — intent enum validation
// ---------------------------------------------------------------------------

describe('validateContentInput — intent validation', () => {
  it('rejects unknown intent', () => {
    const result = validateContentInput(validFormData({ intent: 'delete' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/intent/i);
  });

  it('rejects empty intent', () => {
    const result = validateContentInput(validFormData({ intent: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/intent/i);
  });
});

// ---------------------------------------------------------------------------
// validateContentInput — cover image alt rule
// Mirrors DB CHECK: cover_image_path IS NULL OR
//   (cover_image_alt IS NOT NULL AND length(trim(cover_image_alt)) > 0)
// ---------------------------------------------------------------------------

describe('validateContentInput — cover image alt rule', () => {
  it('fails when cover_image_path is set but cover_image_alt is empty', () => {
    const result = validateContentInput(
      validFormData({ cover_image_path: 'media/hero.jpg', cover_image_alt: '' }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/alt/i);
  });

  it('fails when cover_image_path is set but cover_image_alt is whitespace-only', () => {
    const result = validateContentInput(
      validFormData({ cover_image_path: 'media/hero.jpg', cover_image_alt: '   ' }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/alt/i);
  });

  it('passes when cover_image_path is empty and cover_image_alt is also empty', () => {
    const result = validateContentInput(
      validFormData({ cover_image_path: '', cover_image_alt: '' }),
    );
    expect(result.ok).toBe(true);
  });

  it('passes when both path and alt are provided', () => {
    const result = validateContentInput(
      validFormData({
        cover_image_path: 'media/hero.jpg',
        cover_image_alt: 'Scenic mountain view',
      }),
    );
    expect(result.ok).toBe(true);
  });
});
