'use client';
import { useActionState } from 'react';
import { sendMagicLink, type SendMagicLinkState } from './actions';

const initialState: SendMagicLinkState = { status: 'idle' };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === 'sent') {
    return (
      <div className="mt-8 rounded-2xl border border-fg/15 bg-white p-6">
        <p className="font-display text-lg">Check your inbox.</p>
        <p className="mt-2 text-sm leading-relaxed text-fg/70">
          If that address is registered, a sign-in link is on its way. It
          expires in an hour.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg/55">
          Email
        </span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          autoFocus
          className="mt-2 w-full rounded-lg border border-fg/15 bg-white px-4 py-3 text-fg outline-none transition focus:border-accent"
        />
      </label>
      {state.status === 'error' && (
        <p className="text-sm text-accent">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-contrast transition hover:brightness-105 disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send sign-in link'}
      </button>
    </form>
  );
}
