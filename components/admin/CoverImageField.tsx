'use client';
import { useRef, useState } from 'react';
import { uploadImage } from '@/lib/admin/upload-client';
import { ALLOWED_IMAGE_TYPES } from '@/lib/admin/upload';
import { mediaUrl } from '@/lib/content/media';

interface CoverImageFieldProps {
  initialPath: string | null;
  initialAlt: string | null;
}

// Styling constants match ContentEditor.tsx labelClasses / inputClasses
const labelClasses =
  'block font-mono text-[11px] uppercase tracking-[0.22em] text-fg/55';
const inputClasses =
  'mt-1 w-full rounded-lg border border-fg/15 bg-white px-4 py-2.5 text-sm text-fg outline-none transition focus:border-accent';

export function CoverImageField({ initialPath, initialAlt }: CoverImageFieldProps) {
  const [path, setPath] = useState(initialPath ?? '');
  const [alt, setAlt] = useState(initialAlt ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the file input so the same file can be re-selected after an error
    e.target.value = '';

    // Require alt text before uploading — mirrors the validateContentInput
    // cover-requires-alt rule; better UX to enforce at upload time.
    if (!alt.trim()) {
      setError('Add alt text before uploading.');
      return;
    }

    setError(null);
    setUploading(true);

    const result = await uploadImage(file);

    setUploading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setPath(result.path);
  }

  function handleRemove() {
    // Clears path from form state only. Does NOT delete the storage object —
    // orphan cleanup is out of scope for this component.
    setPath('');
    setError(null);
  }

  const previewSrc = path ? mediaUrl(path) : null;

  return (
    <fieldset className="rounded-xl border border-fg/10 p-4 space-y-4">
      <legend className="px-1 font-mono text-[11px] uppercase tracking-[0.22em] text-fg/55">
        Cover image
      </legend>

      {/* Hidden input carries the path value through form submission */}
      <input type="hidden" name="cover_image_path" value={path} />

      {/* Alt text — always visible so the admin can type it before picking a file */}
      <label className={labelClasses}>
        Alt text
        <input
          type="text"
          name="cover_image_alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          // Enter while typing alt must not submit (and save) the post.
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          className={inputClasses}
          placeholder="Describe the image for screen readers"
        />
      </label>
      {path && !alt.trim() && (
        <p className="text-[12px] text-accent">Alt text is required for the cover image.</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={[...ALLOWED_IMAGE_TYPES].join(',')}
        className="sr-only"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {/* Preview (when a path is set) */}
      {previewSrc ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview: dynamic Supabase URL, not suitable for next/image optimization */}
          <img
            src={previewSrc}
            alt={alt || 'Cover image preview'}
            className="w-full rounded-lg border border-fg/10 object-cover"
            style={{ maxHeight: '200px' }}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              className="rounded-full border border-fg/20 px-4 py-2 text-sm font-medium text-fg transition hover:border-fg/40 disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="rounded-full border border-accent/30 px-4 py-2 text-sm font-medium text-accent transition hover:border-accent/60 disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* No image — show the file picker prominently */
        <div>
          <button
            type="button"
            onClick={openFilePicker}
            disabled={uploading}
            className="w-full rounded-lg border border-dashed border-fg/20 px-4 py-6 text-sm text-fg/55 transition hover:border-fg/40 hover:text-fg/70 disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Choose image (JPEG, PNG, WebP, GIF — max 5 MB)'}
          </button>
        </div>
      )}

      {/* Inline error */}
      {error && (
        <p role="alert" className="rounded-lg bg-accent/10 px-4 py-2 text-sm text-accent">
          {error}
        </p>
      )}
    </fieldset>
  );
}
