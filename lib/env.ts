function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  siteUrl: () => required('NEXT_PUBLIC_SITE_URL'),
  supabaseUrl: () => required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: () => required('SUPABASE_SERVICE_ROLE_KEY'),
  adminEmails: () =>
    required('ADMIN_EMAILS')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean),
  // Optional: unsalted IP hashing (a fixed dev literal) is an acceptable
  // fallback for sites running the memory rate limiter (no CMS/Supabase);
  // production Supabase mode should set a real salt.
  leadRateLimitSalt: () => optional('LEAD_RATE_LIMIT_SALT'),
  googleSiteVerification: () => optional('GOOGLE_SITE_VERIFICATION'),
  bingSiteVerification: () => optional('BING_SITE_VERIFICATION'),
  // Optional so lead capture keeps working before the key is configured;
  // the email send is skipped (and logged) when unset.
  resendApiKey: () => optional('RESEND_API_KEY'),
  // Optional sender address for transactional email. Falls back to Resend's
  // shared sandbox address, which works with no domain verification.
  resendFrom: () => optional('RESEND_FROM'),
  // HMAC secret for unsubscribe link tokens. Dedicated secret rather than
  // reusing LEAD_RATE_LIMIT_SALT: rotating the rate-limit salt (cheap, only
  // resets in-flight rate windows) must never invalidate unsubscribe links
  // already sitting in people's inboxes.
  unsubscribeSecret: () => required('UNSUBSCRIBE_SECRET'),
};
