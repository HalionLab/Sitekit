'use client';
import { useActionState, useRef, useState } from 'react';
import type { ContentItem } from '@/lib/content/queries';
import type { ContentKind } from '@/lib/admin/content';
import { savePost, deletePost, type ContentActionState } from '@/app/admin/posts/actions';
import { SlugField } from './SlugField';
import { MarkdownPreview } from './MarkdownPreview';
import { CoverImageField } from './CoverImageField';
import { InBodyImageInserter } from './InBodyImageInserter';

interface ContentEditorProps {
  /** null = new post; existing row = edit */
  initial: ContentItem | null;
  kind: ContentKind;
}

const SAVE_INITIAL: ContentActionState = { ok: false, error: null };
const DELETE_INITIAL: ContentActionState = { ok: false, error: null };

const labelClasses =
  'block font-mono text-[11px] uppercase tracking-[0.22em] text-fg/55';
const inputClasses =
  'mt-1 w-full rounded-lg border border-fg/15 bg-white px-4 py-2.5 text-sm text-fg outline-none transition focus:border-accent';
const textareaBaseClasses =
  'mt-1 w-full rounded-lg border border-fg/15 bg-white px-4 py-2.5 text-sm text-fg outline-none transition focus:border-accent resize-y';

export function ContentEditor({ initial, kind }: ContentEditorProps) {
  const [saveState, saveAction, savePending] = useActionState(savePost, SAVE_INITIAL);
  const [deleteState, deleteAction, deletePending] = useActionState(deletePost, DELETE_INITIAL);

  // Controlled body_markdown to drive MarkdownPreview
  const [bodyMarkdown, setBodyMarkdown] = useState(initial?.body_markdown ?? '');
  // Title value for SlugField auto-derivation
  const [titleValue, setTitleValue] = useState(initial?.title ?? '');

  // Ref for the body textarea — used by InBodyImageInserter for cursor-position insertion
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Confirm-delete toggle (avoids window.confirm)
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isExisting = initial !== null;
  const isPublished = initial?.status === 'published';

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* ── Left column: form ────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Status badge */}
        <div className="mb-6 flex items-center gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            {isExisting ? kind : `New ${kind}`}
          </p>
          {isExisting && (
            <span
              className={[
                'inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]',
                isPublished
                  ? 'bg-accent-alt/15 text-accent-alt'
                  : 'bg-surface-inverse/8 text-fg/55',
              ].join(' ')}
            >
              {initial.status}
            </span>
          )}
        </div>

        <form action={saveAction} className="space-y-5">
          {/* Hidden fields */}
          <input type="hidden" name="id" value={initial?.id ?? ''} />
          <input type="hidden" name="kind" value={kind} />

          {/* Title */}
          <label className={labelClasses}>
            Title
            <input
              required
              type="text"
              name="title"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              className={inputClasses}
              placeholder="Post title"
            />
          </label>

          {/* Slug */}
          <SlugField
            initialSlug={initial?.slug ?? ''}
            titleValue={titleValue}
            isExisting={isExisting}
          />

          {/* Excerpt */}
          <label className={labelClasses}>
            Excerpt
            <textarea
              name="excerpt"
              rows={2}
              defaultValue={initial?.excerpt ?? ''}
              className={textareaBaseClasses}
              placeholder="A short summary shown in blog listings."
            />
          </label>

          {/* Body */}
          <label className={labelClasses}>
            Body (Markdown)
            <textarea
              ref={bodyRef}
              name="body_markdown"
              rows={18}
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              className={`${textareaBaseClasses} font-mono text-[13px]`}
              placeholder="Write your post in Markdown…"
            />
          </label>

          <InBodyImageInserter
            textareaRef={bodyRef}
            value={bodyMarkdown}
            onChange={setBodyMarkdown}
          />

          {/* SEO */}
          <fieldset className="rounded-xl border border-fg/10 p-4 space-y-4">
            <legend className="px-1 font-mono text-[11px] uppercase tracking-[0.22em] text-fg/55">
              SEO
            </legend>
            <label className={labelClasses}>
              Meta title
              <input
                type="text"
                name="meta_title"
                defaultValue={initial?.meta_title ?? ''}
                className={inputClasses}
                placeholder="Overrides title in <title> tag"
              />
            </label>
            <label className={labelClasses}>
              Meta description
              <input
                type="text"
                name="meta_description"
                defaultValue={initial?.meta_description ?? ''}
                className={inputClasses}
                placeholder="Shown in search results"
              />
            </label>
          </fieldset>

          {/* Cover image */}
          <CoverImageField
            initialPath={initial?.cover_image_path ?? null}
            initialAlt={initial?.cover_image_alt ?? null}
          />

          {/* Error display */}
          {saveState.error && (
            <p role="alert" className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
              {saveState.error}
            </p>
          )}

          {/* Intent buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              name="intent"
              value="draft"
              disabled={savePending}
              className="rounded-full border border-fg/20 px-5 py-2.5 text-sm font-medium text-fg transition hover:border-fg/40 disabled:opacity-60"
            >
              {savePending ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={savePending}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition hover:brightness-105 disabled:opacity-60"
            >
              {savePending ? 'Saving…' : isPublished ? 'Save & publish' : 'Publish'}
            </button>
            {isPublished && (
              <button
                type="submit"
                name="intent"
                value="unpublish"
                disabled={savePending}
                className="rounded-full border border-fg/20 px-5 py-2.5 text-sm font-medium text-fg/60 transition hover:border-fg/40 hover:text-fg disabled:opacity-60"
              >
                {savePending ? 'Saving…' : 'Unpublish'}
              </button>
            )}
          </div>
        </form>

        {/* ── Delete (separate form, outside the main form) ─────────────── */}
        {isExisting && (
          <div className="mt-10 border-t border-fg/10 pt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg/40 mb-3">
              Danger zone
            </p>
            {deleteState.error && (
              <p role="alert" className="mb-3 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
                {deleteState.error}
              </p>
            )}
            {confirmDelete ? (
              <form action={deleteAction} className="flex items-center gap-3">
                <input type="hidden" name="id" value={initial.id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition hover:brightness-105 disabled:opacity-60"
                >
                  {deletePending ? 'Deleting…' : 'Yes, delete this post'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full border border-fg/20 px-5 py-2.5 text-sm font-medium text-fg transition hover:border-fg/40"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-full border border-accent/40 px-5 py-2.5 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent/5"
              >
                Delete post
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Right column: live preview ───────────────────────────────────── */}
      <div className="w-full lg:w-[45%] lg:sticky lg:top-8">
        <MarkdownPreview markdown={bodyMarkdown} />
      </div>
    </div>
  );
}
