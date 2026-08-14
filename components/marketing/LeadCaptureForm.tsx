'use client';
import { useState, useTransition, FormEvent } from 'react';
import emailSpellChecker from '@zootools/email-spell-checker';
import { submitLead } from '@/app/(site)/actions';

type Source = 'download' | 'newsletter' | 'quote' | 'contact';

interface Props {
  source: Source;
  placeholder?: string;
  submitLabel?: string;
  className?: string;
}

export function LeadCaptureForm({ source, placeholder = 'you@yourbusiness.com', submitLabel = 'Get the free download →', className = '' }: Props) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<'idle' | { ok: true; downloadUrl?: string } | { error: string }>('idle');
  const [email, setEmail] = useState('');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await submitLead({
        email: String(fd.get('email') ?? ''),
        source: String(fd.get('source') ?? source),
        honeypot: String(fd.get('company') ?? ''),
      });
      setState(r.ok ? { ok: true, downloadUrl: r.downloadUrl } : { error: r.error });
    });
  }

  if (typeof state === 'object' && 'ok' in state) {
    return (
      <div className={`rounded-2xl bg-surface border border-fg/12 px-5 py-4 text-sm text-fg ${className}`} role="status" aria-live="polite">
        <p>Thanks — check your inbox.</p>
        {state.downloadUrl && (
          <a
            href={state.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-medium text-accent underline underline-offset-2 hover:brightness-110"
          >
            Download now →
          </a>
        )}
      </div>
    );
  }

  // Client-side typo nudge only — never blocks submit. Suggests a corrected
  // domain/TLD (e.g. gmial.com → gmail.com) the user can accept with one tap.
  const suggestion = email.includes('@') ? emailSpellChecker.run({ email }) : undefined;
  const errorMessage = typeof state === 'object' && 'error' in state ? state.error : null;

  return (
    <form onSubmit={onSubmit} className={`relative rounded-2xl sm:rounded-full bg-surface border border-fg/12 p-2 sm:p-1.5 sm:pl-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 ${className}`}>
      <input type="hidden" name="source" value={source} />
      {/* Honeypot: hidden from real users, attractive to bots */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off"
             className="absolute left-[-9999px] w-px h-px opacity-0" aria-hidden />
      <input
        required type="email" name="email" placeholder={placeholder}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          // Clear a prior submit error as the user edits, so the typo
          // suggestion can surface while they fix the address.
          if (typeof state === 'object' && 'error' in state) setState('idle');
        }}
        className="w-full sm:flex-1 bg-transparent text-sm outline-none placeholder:text-fg/45 px-3 py-2 sm:px-0 sm:py-0"
        aria-label="Email address"
      />
      <button
        type="submit" disabled={pending}
        className="w-full sm:w-auto rounded-full bg-accent text-accent-contrast px-5 py-2.5 text-sm font-medium hover:brightness-105 transition disabled:opacity-60"
      >
        {pending ? 'Sending…' : submitLabel}
      </button>
      {errorMessage ? (
        <p className="absolute left-0 top-full mt-2 text-accent text-xs" role="alert">{errorMessage}</p>
      ) : suggestion ? (
        <p className="absolute left-0 top-full mt-2 text-xs text-fg/70" aria-live="polite">
          Did you mean{' '}
          <button
            type="button"
            onClick={() => setEmail(suggestion.full)}
            className="font-medium text-accent underline underline-offset-2 hover:brightness-110"
          >
            {suggestion.full}
          </button>
          ?
        </p>
      ) : null}
    </form>
  );
}
