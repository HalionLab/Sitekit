'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadDownloadPdf } from '@/lib/admin/download-upload-client';
import { saveDownloadItem } from '@/app/admin/downloads/actions';
import { DOWNLOAD_MIME } from '@/lib/admin/download-upload';

const labelClasses =
  'block font-mono text-[11px] uppercase tracking-[0.22em] text-fg/55';
const inputClasses =
  'mt-1 w-full rounded-lg border border-fg/15 bg-white px-4 py-2.5 text-sm text-fg outline-none transition focus:border-accent';

/**
 * Upload + save a new download item in one flow: validate label, upload the
 * PDF (browser -> Supabase via signed URL), then insert the download_items
 * row. makeCurrent defaults checked so the first upload goes live in one
 * action.
 */
export function DownloadUploadForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (!label.trim()) {
      setError('Enter a label, e.g. "2026 Service Guide".');
      return;
    }
    if (!file) {
      setError('Choose a PDF to upload.');
      return;
    }

    setBusy(true);

    const up = await uploadDownloadPdf(file, label.trim());
    if (!up.ok) {
      setBusy(false);
      setError(up.error);
      return;
    }

    const saved = await saveDownloadItem({
      label: label.trim(),
      storagePath: up.path,
      makeCurrent,
    });
    setBusy(false);

    if (!saved.ok) {
      setError(saved.error);
      return;
    }

    // Reset and refresh the list (server component re-renders with the new row).
    setLabel('');
    setFileName(null);
    setMakeCurrent(true);
    if (fileRef.current) fileRef.current.value = '';
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-fg/10 bg-white p-6 space-y-5"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
        Upload a new download
      </p>

      <label className={labelClasses}>
        Label
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          className={inputClasses}
          placeholder="2026 Service Guide"
        />
      </label>

      <div>
        <span className={labelClasses}>PDF</span>
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-full border border-fg/20 px-4 py-2 text-sm font-medium text-fg transition hover:border-fg/40 disabled:opacity-60"
          >
            {fileName ? 'Choose a different PDF' : 'Choose PDF'}
          </button>
          {fileName && <span className="truncate text-sm text-fg/60">{fileName}</span>}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={DOWNLOAD_MIME}
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          disabled={busy}
        />
        <p className="mt-1.5 text-xs text-fg/40">PDF only · max 25 MB</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-fg/80">
        <input
          type="checkbox"
          checked={makeCurrent}
          onChange={(e) => setMakeCurrent(e.target.checked)}
          className="h-4 w-4 rounded border-fg/30 text-accent focus:ring-accent"
        />
        Make this the current download (publishes it to the landing page + signups)
      </label>

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition hover:brightness-105 disabled:opacity-60"
      >
        {busy ? 'Uploading…' : 'Upload & save'}
      </button>

      {error && (
        <p role="alert" className="rounded-lg bg-accent/10 px-4 py-2 text-sm text-accent">
          {error}
        </p>
      )}
    </form>
  );
}
