import { describe, it, expect } from 'vitest';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  validateImageFile,
  buildUploadPath,
} from '@/lib/admin/upload';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('ALLOWED_IMAGE_TYPES', () => {
  it('includes the four expected MIME types', () => {
    const types = Array.from(ALLOWED_IMAGE_TYPES);
    expect(types).toContain('image/jpeg');
    expect(types).toContain('image/png');
    expect(types).toContain('image/webp');
    expect(types).toContain('image/gif');
  });

  it('contains exactly 4 entries', () => {
    expect(Array.from(ALLOWED_IMAGE_TYPES).length).toBe(4);
  });
});

describe('MAX_IMAGE_BYTES', () => {
  it('equals 5 MB (5 * 1024 * 1024)', () => {
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
  });

  it('matches the migration value 5242880', () => {
    expect(MAX_IMAGE_BYTES).toBe(5_242_880);
  });
});

// ---------------------------------------------------------------------------
// validateImageFile — happy paths
// ---------------------------------------------------------------------------

describe('validateImageFile — allowed types', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
    it(`accepts ${type} at 1 byte`, () => {
      const result = validateImageFile({ type, size: 1 });
      expect(result.ok).toBe(true);
    });
  }

  it('accepts a file exactly at MAX_IMAGE_BYTES', () => {
    const result = validateImageFile({ type: 'image/jpeg', size: MAX_IMAGE_BYTES });
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateImageFile — type errors
// ---------------------------------------------------------------------------

describe('validateImageFile — type rejection', () => {
  it('rejects image/svg+xml with the type error message', () => {
    const result = validateImageFile({ type: 'image/svg+xml', size: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Unsupported image type. Use JPEG, PNG, WebP, or GIF.');
    }
  });

  it('rejects application/pdf with the type error message', () => {
    const result = validateImageFile({ type: 'application/pdf', size: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Unsupported image type. Use JPEG, PNG, WebP, or GIF.');
    }
  });

  it('rejects text/plain with the type error message', () => {
    const result = validateImageFile({ type: 'text/plain', size: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unsupported image type/i);
    }
  });

  it('rejects empty string type with the type error message', () => {
    const result = validateImageFile({ type: '', size: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unsupported image type/i);
    }
  });

  it('checks type before size: a too-large wrong-type file reports the type error', () => {
    const result = validateImageFile({ type: 'image/svg+xml', size: MAX_IMAGE_BYTES + 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Unsupported image type. Use JPEG, PNG, WebP, or GIF.');
    }
  });
});

// ---------------------------------------------------------------------------
// validateImageFile — size errors
// ---------------------------------------------------------------------------

describe('validateImageFile — size rejection', () => {
  it('rejects size 1 byte over the limit with the size error message', () => {
    const result = validateImageFile({ type: 'image/jpeg', size: MAX_IMAGE_BYTES + 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Image is too large. Maximum size is 5 MB.');
    }
  });

  it('rejects size 0 with "No file selected."', () => {
    const result = validateImageFile({ type: 'image/png', size: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('No file selected.');
    }
  });

  it('rejects size -1 with "No file selected."', () => {
    const result = validateImageFile({ type: 'image/png', size: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('No file selected.');
    }
  });
});

// ---------------------------------------------------------------------------
// buildUploadPath
// ---------------------------------------------------------------------------

describe('buildUploadPath', () => {
  // The function uses Date.now() internally; we assert on shape, not exact value.
  const PATH_SHAPE = /^uploads\/\d+-[a-z0-9][a-z0-9-]*\.[a-z0-9]+$/;

  it('result matches the expected shape regex', () => {
    expect(buildUploadPath('photo.jpg')).toMatch(PATH_SHAPE);
  });

  it('starts with "uploads/" and no leading slash', () => {
    const p = buildUploadPath('image.png');
    expect(p.startsWith('uploads/')).toBe(true);
    expect(p.startsWith('/')).toBe(false);
  });

  it('lowercases the extension', () => {
    const p = buildUploadPath('photo.JPG');
    expect(p).toMatch(/\.jpg$/);
  });

  it('lowercases the base name', () => {
    const p = buildUploadPath('MyPhoto.png');
    // sanitized base should be lowercase
    expect(p).toMatch(/uploads\/\d+-myphoto\.png$/);
  });

  it('replaces spaces and punctuation in base with a single hyphen', () => {
    const p = buildUploadPath('my photo (1).png');
    // "my photo (1)" → "my-photo-1"
    expect(p).toMatch(/uploads\/\d+-my-photo-1\.png$/);
  });

  it('collapses multiple non-alphanumeric runs into a single hyphen', () => {
    const p = buildUploadPath('foo___bar--baz.webp');
    expect(p).toMatch(/uploads\/\d+-foo-bar-baz\.webp$/);
  });

  it('strips leading and trailing hyphens from the sanitized base', () => {
    const p = buildUploadPath('--hello--.gif');
    expect(p).toMatch(/uploads\/\d+-hello\.gif$/);
  });

  it('preserves the extension for non-image extensions (validation is MIME-based)', () => {
    const p = buildUploadPath('document.pdf');
    expect(p).toMatch(/\.pdf$/);
  });

  it('uses only the last segment as extension for multi-dot filenames', () => {
    const p = buildUploadPath('my.photo.backup.jpeg');
    expect(p).toMatch(/\.jpeg$/);
    // the base should incorporate the earlier dots as hyphens: "my-photo-backup"
    expect(p).toMatch(/uploads\/\d+-my-photo-backup\.jpeg$/);
  });

  it('falls back to "image" when base sanitizes to empty string', () => {
    const p = buildUploadPath('!!!!!.png');
    expect(p).toMatch(/uploads\/\d+-image\.png$/);
  });

  it('falls back to "image" for a symbol-only filename without extension', () => {
    const p = buildUploadPath('---');
    // No dot → the whole thing is the base; after sanitizing → empty → "image"
    // ext would be empty-string in this edge case; accept any extension including empty
    expect(p).toMatch(/uploads\/\d+-image/);
  });

  it('handles uppercase extension correctly', () => {
    const p = buildUploadPath('LOGO.PNG');
    expect(p).toMatch(/uploads\/\d+-logo\.png$/);
  });

  it('does not include "media/" prefix (consumers add that)', () => {
    const p = buildUploadPath('hero.jpg');
    expect(p.startsWith('media/')).toBe(false);
  });

  it('timestamp is a plausible millisecond epoch (> year-2000 boundary)', () => {
    const p = buildUploadPath('test.jpg');
    const ts = parseInt(p.split('/')[1].split('-')[0], 10);
    // 2000-01-01 in ms
    expect(ts).toBeGreaterThan(946_684_800_000);
  });
});
