'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setCurrentDownload, deleteDownloadItem } from '@/app/admin/downloads/actions';

/**
 * Per-row admin controls for a download item. The current item shows no
 * "Mark current" button and cannot be deleted (delete is guarded server-side
 * too); other items can be promoted or removed. Errors surface inline.
 */
export function DownloadActions({
  id,
  label,
  isCurrent,
}: {
  id: string;
  label: string;
  isCurrent: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function markCurrent() {
    setError(null);
    startTransition(async () => {
      const r = await setCurrentDownload(id);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  function remove() {
    setError(null);
    if (!window.confirm(`Delete "${label}"? This removes the PDF permanently.`)) return;
    startTransition(async () => {
      const r = await deleteDownloadItem(id);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-3">
        {!isCurrent && (
          <button
            type="button"
            onClick={markCurrent}
            disabled={pending}
            className="text-xs font-medium text-accent transition hover:text-fg disabled:opacity-60"
          >
            {pending ? 'Working…' : 'Mark current'}
          </button>
        )}
        {!isCurrent && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-xs text-fg/55 transition hover:text-accent disabled:opacity-60"
          >
            Delete
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="max-w-xs text-right text-xs text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
