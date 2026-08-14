'use server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin/auth';
import { isValidEmail } from '@/lib/validation/email';
import { env } from '@/lib/env';

export type SendMagicLinkState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; message: string };

export async function sendMagicLink(
  _prev: SendMagicLinkState,
  formData: FormData,
): Promise<SendMagicLinkState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!isValidEmail(email)) {
    return { status: 'error', message: 'Please enter a valid email.' };
  }

  // Allowlist gate BEFORE any Supabase call: non-admin emails get the same
  // "sent" response as admins (no signal about who is on the list), and no
  // magic link or stray auth user is ever created for them.
  if (!isAdminEmail(email)) {
    return { status: 'sent' };
  }

  const sb = await createClient();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      // The Magic Link email template builds its URL from {{ .RedirectTo }},
      // so this works for both localhost and prod. Must be allowlisted in
      // Supabase Auth -> URL Configuration.
      emailRedirectTo: `${env.siteUrl()}/auth/confirm`,
    },
  });
  if (error) {
    // Log message + code/status only -- never the email or client internals.
    // When this is GoTrue's "Error sending magic link email", the underlying
    // SMTP failure detail is only visible in the Supabase Auth logs.
    console.error('login.send_magic_link_failed', {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    return {
      status: 'error',
      message: 'Could not send the sign-in link. Try again in a moment.',
    };
  }
  return { status: 'sent' };
}
