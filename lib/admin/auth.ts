import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

/**
 * The single source of truth for "who is an admin": the ADMIN_EMAILS env var.
 * Comparison is case-insensitive and whitespace-tolerant on both sides
 * (env.adminEmails() already lowercases/trims the list).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return env.adminEmails().includes(email.trim().toLowerCase());
}

/**
 * Reads the Supabase session from request cookies and returns the verified
 * user, or null. Uses getUser() (not getSession()) so the JWT is validated
 * against the Auth server rather than trusted from the cookie.
 */
export async function getSessionUser() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}

/**
 * Cookie-session admin check for places that branch rather than throw
 * (e.g. Draft Mode pages falling back to published-only).
 */
export async function isRequestFromAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return isAdminEmail(user?.email);
}

/**
 * Use in Server Actions and Route Handlers that must only run for admins.
 * Throws if the request is not from an allowlisted admin; the generic error
 * deliberately carries no signal about whether a session existed.
 */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const user = await getSessionUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    throw new Error('Not authorized');
  }
  return { id: user.id, email: user.email };
}
