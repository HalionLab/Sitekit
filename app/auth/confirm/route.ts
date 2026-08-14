import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { disabledResponse, features } from '@/lib/config/features';

/**
 * Magic-link landing route (token-hash flow).
 *
 * The Supabase Magic Link email template is configured to link to
 * {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email, where RedirectTo
 * is this route (set by sendMagicLink's emailRedirectTo). verifyOtp validates
 * the hash server-side and sets the session cookies via the cookie-bound
 * client. Unlike the PKCE code flow, this works even if the link is opened in
 * a different browser than the one that requested it.
 */
export async function GET(request: NextRequest) {
  if (!features.cms) return disabledResponse();

  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (tokenHash && type) {
    const sb = await createClient();
    const { error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    console.error('auth.confirm_failed', error.message);
  }

  // Invalid or expired link: back to login. The page shows its normal form;
  // we don't distinguish failure causes to the visitor.
  return NextResponse.redirect(new URL('/login', request.url));
}
