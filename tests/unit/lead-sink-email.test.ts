import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { site } from '@/site.config';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function Resend(this: { emails: { send: typeof sendMock } }) {
    this.emails = { send: sendMock };
  }),
}));

describe('emailSink.capture', () => {
  const originalKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    sendMock.mockReset();
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
  });

  it('sends to site.business.email with the source in the subject and replyTo set to the enquirer', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    sendMock.mockResolvedValue({ data: { id: 'abc123' }, error: null });

    const { emailSink } = await import('@/lib/leads/sinks/email');
    const result = await emailSink.capture({
      email: 'jane@customer.com',
      name: 'Jane',
      phone: '+1-555-0100',
      message: 'Need a quote for a new furnace.',
      source: 'contact',
    });

    expect(result).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toEqual([site.business.email]);
    expect(call.subject).toContain('contact');
    expect(call.replyTo).toBe('jane@customer.com');
  });

  it('returns { ok: false, reason: "unconfigured" } without throwing when RESEND_API_KEY is unset', async () => {
    delete process.env.RESEND_API_KEY;

    const { emailSink } = await import('@/lib/leads/sinks/email');
    await expect(
      emailSink.capture({ email: 'jane@customer.com', source: 'contact' }),
    ).resolves.toEqual({ ok: false, reason: 'unconfigured' });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('returns { ok: false, reason: "error" } and does not throw when Resend reports an error', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    sendMock.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'bad request' } });

    const { emailSink } = await import('@/lib/leads/sinks/email');
    await expect(
      emailSink.capture({ email: 'jane@customer.com', source: 'contact' }),
    ).resolves.toEqual({ ok: false, reason: 'error' });
  });
});
