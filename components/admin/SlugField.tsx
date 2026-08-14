'use client';
import { useRef, useState } from 'react';
import { deriveSlug } from '@/lib/admin/content';

interface SlugFieldProps {
  initialSlug: string;
  titleValue: string;
  isExisting: boolean;
}

export function SlugField({ initialSlug, titleValue, isExisting }: SlugFieldProps) {
  // For NEW posts: null = auto-derive from title; string = user has manually set.
  // For EXISTING posts: locked = true by default; unlocked = user can edit.
  const [manualSlug, setManualSlug] = useState<string | null>(
    isExisting ? initialSlug : null,
  );
  const [locked, setLocked] = useState(isExisting);
  const inputRef = useRef<HTMLInputElement>(null);

  // For new posts when not manually set, derive live from title.
  const slug = manualSlug !== null ? manualSlug : deriveSlug(titleValue);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Setting manualSlug (non-null) is what stops auto-derivation for new
    // posts; `locked`/disabled stays an existing-post-only concept so the
    // field never disables itself mid-typing.
    setManualSlug(e.target.value);
  }

  function handleUnlock() {
    setLocked(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleLock() {
    setLocked(true);
  }

  const inputClasses =
    'mt-1 w-full rounded-lg border border-fg/15 bg-white px-4 py-2.5 font-mono text-sm text-fg outline-none transition focus:border-accent disabled:bg-surface-inverse/5 disabled:text-fg/50 disabled:cursor-not-allowed';

  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="slug-input" className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg/55">
          Slug
        </label>
        {isExisting && (
          locked ? (
            <button
              type="button"
              onClick={handleUnlock}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent transition hover:brightness-110"
            >
              Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLock}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg/50 transition hover:text-fg"
            >
              Lock
            </button>
          )
        )}
      </div>
      <input type="hidden" name="slug" value={slug} />
      <input
        ref={inputRef}
        id="slug-input"
        type="text"
        value={slug}
        onChange={handleChange}
        disabled={locked}
        placeholder="my-post-slug"
        className={inputClasses}
      />
      {isExisting && !locked && (
        <p className="mt-1.5 text-[12px] leading-snug text-accent">
          Warning: changing the slug changes the public URL of this post.
        </p>
      )}
    </div>
  );
}
