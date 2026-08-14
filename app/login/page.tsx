import type { Metadata } from 'next';
import { notFoundUnless, features } from '@/lib/config/features';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Admin sign-in',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  notFoundUnless(features.cms);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl tracking-tight">Admin sign-in</h1>
        <p className="mt-3 text-sm leading-relaxed text-fg/70">
          Enter your email and we&apos;ll send you a one-time sign-in link.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
