'use client';
import { useState, useTransition, FormEvent } from 'react';
import { submitEnquiry } from '@/app/(site)/contact/actions';

interface Props {
  source?: 'contact' | 'quote';
  className?: string;
}

export function ContactForm({ source = 'contact', className = '' }: Props) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<'idle' | { ok: true } | { error: string }>('idle');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await submitEnquiry({
        name: String(fd.get('name') ?? ''),
        email: String(fd.get('email') ?? ''),
        phone: String(fd.get('phone') ?? ''),
        message: String(fd.get('message') ?? ''),
        source: String(fd.get('source') ?? source),
        honeypot: String(fd.get('company') ?? ''),
      });
      setState(r.ok ? { ok: true } : { error: r.error });
    });
  }

  if (typeof state === 'object' && 'ok' in state) {
    return (
      <div
        className={`rounded-2xl bg-surface border border-border-token px-6 py-8 text-sm text-fg ${className}`}
        role="status"
        aria-live="polite"
      >
        <p className="font-display text-xl">Message sent.</p>
        <p className="mt-2 text-fg/75">Thanks — we&apos;ll get back to you within one business day.</p>
      </div>
    );
  }

  const errorMessage = typeof state === 'object' && 'error' in state ? state.error : null;

  return (
    <form
      onSubmit={onSubmit}
      className={`relative rounded-2xl bg-surface border border-border-token p-6 sm:p-8 space-y-5 ${className}`}
    >
      <input type="hidden" name="source" value={source} />
      {/* Honeypot: hidden from real users, attractive to bots */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] w-px h-px opacity-0"
        aria-hidden
      />

      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-fg mb-1.5">
          Name
        </label>
        <input
          required
          id="contact-name"
          type="text"
          name="name"
          autoComplete="name"
          aria-label="Name"
          className="w-full rounded-lg border border-border-token bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-fg mb-1.5">
          Email
        </label>
        <input
          required
          id="contact-email"
          type="email"
          name="email"
          autoComplete="email"
          aria-label="Email address"
          className="w-full rounded-lg border border-border-token bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className="block text-sm font-medium text-fg mb-1.5">
          Phone <span className="text-fg/45 font-normal">(optional)</span>
        </label>
        <input
          id="contact-phone"
          type="tel"
          name="phone"
          autoComplete="tel"
          aria-label="Phone number"
          className="w-full rounded-lg border border-border-token bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-fg mb-1.5">
          Message
        </label>
        <textarea
          required
          id="contact-message"
          name="message"
          rows={5}
          aria-label="Message"
          className="w-full rounded-lg border border-border-token bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent resize-none"
        />
      </div>

      {errorMessage && (
        <p className="text-accent text-sm" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent text-accent-contrast px-5 py-3 text-sm font-medium hover:brightness-105 transition disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
