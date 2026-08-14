import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import { site } from '@/site.config';

/**
 * Supabase session refresh (Next 16 `proxy` convention -- the renamed
 * `middleware`).
 *
 * Server Components can read cookies but never write them, so when a Supabase
 * access token expires, only this proxy can persist the rotated refresh token
 * back to the browser. Without it, refresh-token reuse detection eventually
 * revokes the admin's session. See lib/supabase/server.ts, whose setAll
 * swallows writes for exactly this reason.
 *
 * Public pages stay static+ISR: the proxy runs in front of the cache without
 * forcing dynamic rendering, and anonymous visitors (no sb-* cookies) skip the
 * Supabase round trip entirely.
 */
export async function proxy(request: NextRequest) {
  // File mode: no Supabase session to refresh, and no env vars to touch.
  if (!site.features.cms) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  // Anonymous visitor -- nothing to refresh.
  const hasAuthCookies = request.cookies
    .getAll()
    .some(c => c.name.startsWith('sb-'));
  if (!hasAuthCookies) return response;

  const supabase = createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: toSet => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() validates the JWT and, if expired, refreshes it -- triggering
  // setAll above so the new tokens reach the browser.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Skip static assets; everything else (pages, route handlers) gets the
  // session refresh.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|css|js|map|txt|xml|woff2?)$).*)',
  ],
};
