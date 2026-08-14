/**
 * Environment access for e2e tests. Tests run in plain Node (via dotenv-cli
 * loading .env.local), so they cannot import from lib/ -- those modules import
 * 'server-only', which throws outside React Server Components.
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(
      `Missing required env var for e2e tests: ${name}. Run via "npm run test:e2e" so .env.local is loaded.`,
    );
  }
  return v;
}

export const testEnv = {
  /** Production by default; set E2E_BASE_URL=http://localhost:3000 to override. */
  baseURL: () => process.env.E2E_BASE_URL ?? 'https://example.com',
  supabaseUrl: () => required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  serviceRoleKey: () => required('SUPABASE_SERVICE_ROLE_KEY'),
  /** First ADMIN_EMAILS entry -- the user e2e admin sessions are created for. */
  adminEmail: () => {
    const emails = required('ADMIN_EMAILS')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) throw new Error('ADMIN_EMAILS is empty');
    return emails[0];
  },
};
