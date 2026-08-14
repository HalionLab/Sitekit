import 'server-only';
import { after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeEmail } from '@/lib/email/send';
import type { LeadSink, Enquiry } from '../types';

/** Sources that trigger the existing welcome-email flow after insert. */
const WELCOME_SOURCES = new Set(['newsletter', 'download']);

function buildNotes(e: Enquiry): string | null {
  const lines: string[] = [`source: ${e.source}`];
  if (e.name) lines.push(`name: ${e.name}`);
  if (e.phone) lines.push(`phone: ${e.phone}`);
  if (e.message) lines.push(`message: ${e.message}`);
  return lines.join('\n');
}

/**
 * Wraps the existing `leads` table insert path (previously inline in
 * `app/(site)/actions.ts`'s `submitLead`) behind the `LeadSink` interface --
 * the CMS-mode sink, selected when `features.cms` and Supabase are
 * configured. `capture` never throws; failures are reported via the return
 * value.
 */
export const supabaseSink: LeadSink = {
  async capture(e: Enquiry) {
    try {
      const sb = createAdminClient();
      const { data: inserted, error } = await sb
        .from('leads')
        .insert({
          email: e.email,
          source: e.source,
          notes: buildNotes(e),
          user_agent: e.userAgent ?? null,
        })
        .select('id')
        .single();

      if (error) {
        console.error('leads.supabase_insert_failed', error.message);
        return { ok: false, reason: 'error' };
      }

      // Welcome email goes out after the response is sent -- it never
      // delays or fails the capture.
      if (WELCOME_SOURCES.has(e.source)) {
        after(() => sendWelcomeEmail(inserted.id, e.email, e.source, null));
      }

      return { ok: true };
    } catch (err) {
      console.error('leads.supabase_capture_threw', err instanceof Error ? err.message : 'unknown error');
      return { ok: false, reason: 'error' };
    }
  },
};
