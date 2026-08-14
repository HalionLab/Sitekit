import 'server-only';
import { Resend } from 'resend';
import { env } from '@/lib/env';
import { site } from '@/site.config';
import { EnquiryEmail } from '@/lib/email/enquiry';
import type { LeadSink, Enquiry } from '../types';

/**
 * Sender identity for enquiry notifications. Falls back to Resend's shared
 * sandbox address -- `enquiries@<site domain>` would fail to send until the
 * domain is verified in the Resend dashboard, which most template users
 * won't have done on day one.
 */
const FROM = env.resendFrom() ?? 'onboarding@resend.dev';

/**
 * Delivers enquiries straight to the business inbox via Resend -- the
 * default sink for sites running without Supabase/CMS mode. `capture` never
 * throws: any failure (missing key, Resend error, network) is reported
 * through the return value so the calling server action can degrade the
 * user's submit into a success instead of an error.
 */
export const emailSink: LeadSink = {
  async capture(e: Enquiry) {
    try {
      const apiKey = env.resendApiKey();
      if (!apiKey) {
        return { ok: false, reason: 'unconfigured' };
      }

      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from: FROM,
        to: [site.business.email],
        replyTo: e.email,
        subject: `New ${e.source} enquiry — ${site.name}`,
        react: EnquiryEmail({
          source: e.source,
          siteName: site.name,
          name: e.name,
          email: e.email,
          phone: e.phone,
          message: e.message,
        }),
      });

      if (error) {
        // Resend returns errors in the result rather than throwing.
        console.error('leads.email_send_failed', { name: error.name, message: error.message });
        return { ok: false, reason: 'error' };
      }

      return { ok: true };
    } catch (err) {
      console.error('leads.email_send_threw', err instanceof Error ? err.message : 'unknown error');
      return { ok: false, reason: 'error' };
    }
  },
};
