'use client';
import { useRef, useState } from 'react';
import { uploadImage } from '@/lib/admin/upload-client';
import { ALLOWED_IMAGE_TYPES } from '@/lib/admin/upload';

interface InBodyImageInserterProps {
  /** Ref to the body_markdown <textarea> in ContentEditor, for cursor-position insertion. */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Current body markdown value. */
  value: string;
  /** Setter to update the body markdown (same setter ContentEditor uses). */
  onChange: (next: string) => void;
}

// Styling constants match ContentEditor.tsx / CoverImageField.tsx
const labelClasses =
  'block font-mono text-[11px] uppercase tracking-[0.22em] text-fg/55';
const inputClasses =
  'mt-1 w-full rounded-lg border border-fg/15 bg-white px-4 py-2.5 text-sm text-fg outline-none transition focus:border-accent';

export function InBodyImageInserter({ textareaRef, value, onChange }: InBodyImageInserterProps) {
  const [alt, setAlt] = useState('');
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

    // Require alt text before uploading
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

    const snippet = `![${alt}](${result.path})`;

    // Insert at cursor position
    const textarea = textareaRef.current;
    let newValue: string;
    let insertStart: number;

    if (textarea) {
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? start;
      const before = value.slice(0, start);
      const after = value.slice(end);
      newValue = before + snippet + after;
      insertStart = start;
    } else {
      // Fallback: append if ref is null
      newValue = value + snippet;
      insertStart = value.length;
    }

    onChange(newValue);

    // Clear alt input and restore focus to textarea with caret after snippet
    setAlt('');

    if (textarea) {
      requestAnimationFrame(() => {
        textarea.focus();
        const caretPos = insertStart + snippet.length;
        textarea.setSelectionRange(caretPos, caretPos);
      });
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-fg/10 p-4 space-y-3">
      <p className={labelClasses}>Insert image</p>

      <label className={labelClasses}>
        Alt text
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          // Enter in this mid-workflow field must not submit (and save) the post.
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          className={inputClasses}
          placeholder="Describe the image"
          disabled={uploading}
        />
      </label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={[...ALLOWED_IMAGE_TYPES].join(',')}
        className="sr-only"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <button
        type="button"
        onClick={openFilePicker}
        disabled={uploading}
        className="rounded-full border border-fg/20 px-4 py-2 text-sm font-medium text-fg transition hover:border-fg/40 disabled:opacity-60"
      >
        {uploading ? 'Uploading…' : 'Upload & insert image'}
      </button>

      {/* Inline error */}
      {error && (
        <p role="alert" className="rounded-lg bg-accent/10 px-4 py-2 text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
