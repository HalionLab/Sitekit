import { createServerClient } from '@supabase/ssr';
import type { BrowserContext } from '@playwright/test';
import { createServiceRoleClient } from './supabase';
import { testEnv } from './env';

/** Cookie shape accepted by BrowserContext.addCookies(). */
export interface SessionCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

/**
 * Creates a real Supabase session for the first ADMIN_EMAILS entry and returns
 * it as browser cookies, without sending any email:
 *
 * 1. auth.admin.generateLink (service role) mints a magic-link token
 *    server-side -- no email, so no SMTP rate limits.
 * 2. verifyOtp consumes it through a @supabase/ssr server client whose cookie
 *    jar we capture, so the cookie names, base64 prefix, and chunking are
 *    exactly what the app's own server client expects to read.
 *
 * The admin user must already exist in Supabase Auth (it does: Phase 5 was
 * verified with a real magic-link sign-in).
 */
export async function createAdminSessionCookies(): Promise<SessionCookie[]> {
  const adminEmail = testEnv.adminEmail();
  const admin = createServiceRoleClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: adminEmail,
  });
  if (error) throw new Error(`generateLink failed: ${error.message}`);
  const tokenHash = data.properties?.hashed_token;
  if (!tokenHash) throw new Error('generateLink returned no hashed_token');

  // Capture the cookies @supabase/ssr would set on a real response. Same
  // type=email verification the production /auth/confirm route performs.
  const jar = new Map<string, string>();
  const ssr = createServerClient(testEnv.supabaseUrl(), testEnv.supabaseAnonKey(), {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: cookies => {
        for (const { name, value } of cookies) jar.set(name, value);
      },
    },
  });
  const { error: verifyError } = await ssr.auth.verifyOtp({
    type: 'email',
    token_hash: tokenHash,
  });
  if (verifyError) throw new Error(`verifyOtp failed: ${verifyError.message}`);
  if (jar.size === 0) throw new Error('verifyOtp set no session cookies');

  const url = new URL(testEnv.baseURL());
  return [...jar.entries()].map(([name, value]) => ({
    name,
    value,
    domain: url.hostname,
    path: '/',
    expires: Math.floor(Date.now() / 1000) + 3600,
    httpOnly: false,
    secure: url.protocol === 'https:',
    sameSite: 'Lax' as const,
  }));
}

/** Inject an admin session into a Playwright browser context. */
export async function signInAsAdmin(context: BrowserContext): Promise<void> {
  await context.addCookies(await createAdminSessionCookies());
}
