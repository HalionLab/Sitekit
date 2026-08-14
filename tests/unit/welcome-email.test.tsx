import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'react-email';
import { site } from '@/site.config';
import { WelcomeEmail } from '@/lib/email/welcome';

/**
 * Covers lib/email/send.ts (subject line selection + the suppression/dedup
 * happy path) and lib/email/welcome.tsx (the actual HTML: download CTA +
 * unsubscribe link). Carried over from the T16 review.
 */

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function Resend(this: { emails: { send: typeof sendMock } }) {
    this.emails = { send: sendMock };
  }),
}));

/**
 * Minimal chainable stand-in for the two `sb.from('leads')` query builders
 * sendWelcomeEmail uses: a select chain (suppression check) and an update
 * chain (dedup claim). Keyed by call order since both target the same table.
 */
function makeAdminClientMock() {
  let fromCalls = 0;

  const suppressionBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }), // never opted out
  };

  const claimBuilder = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [{ id: 'lead-1' }], error: null }), // claim wins
  };

  const from = vi.fn(() => {
    fromCalls += 1;
    return fromCalls === 1 ? suppressionBuilder : claimBuilder;
  });

  return { from };
}

let adminClientMock: ReturnType<typeof makeAdminClientMock>;

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => adminClientMock,
}));

describe('sendWelcomeEmail subjects', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    adminClientMock = makeAdminClientMock();
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    process.env.UNSUBSCRIBE_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it(`uses "Your download from ${site.name}" when downloadUrl is present and source is "download"`, async () => {
    const { sendWelcomeEmail } = await import('@/lib/email/send');

    await sendWelcomeEmail('lead-1', 'jane@customer.com', 'download', 'https://example.com/reports/latest.pdf');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.subject).toBe(`Your download from ${site.name}`);
  });

  it(`uses "Welcome to ${site.name}" for source "newsletter"`, async () => {
    const { sendWelcomeEmail } = await import('@/lib/email/send');

    await sendWelcomeEmail('lead-1', 'jane@customer.com', 'newsletter', null);

    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.subject).toBe(`Welcome to ${site.name}`);
  });
});

describe('WelcomeEmail component', () => {
  it('renders the downloadUrl as the CTA link and includes the unsubscribe link', async () => {
    const downloadUrl = 'https://example.com/reports/latest.pdf';
    const unsubscribeUrl = 'https://example.com/unsubscribe?lead=lead-1&token=abc123';

    const html = await render(
      WelcomeEmail({ source: 'download', downloadUrl, unsubscribeUrl }),
    );

    expect(html).toContain(`href="${downloadUrl}"`);
    expect(html).toContain('Download now');
    // react-email HTML-escapes attribute values, so "&" becomes "&amp;".
    expect(html).toContain(`href="${unsubscribeUrl.replace(/&/g, '&amp;')}"`);
    expect(html).toContain('Unsubscribe');
  });

  it('falls back to the "Visit {site.name}" CTA copy for non-download sources', async () => {
    const downloadUrl = 'https://example.com/';
    const unsubscribeUrl = 'https://example.com/unsubscribe?lead=lead-2&token=def456';

    const html = await render(
      WelcomeEmail({ source: 'newsletter', downloadUrl, unsubscribeUrl }),
    );

    expect(html).toContain(`href="${downloadUrl}"`);
    expect(html).toContain(`Visit ${site.name}`);
    expect(html).toContain(`href="${unsubscribeUrl.replace(/&/g, '&amp;')}"`);
  });
});
