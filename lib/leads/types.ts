/**
 * Shape of a captured lead/enquiry, independent of how it's delivered
 * (email, Supabase, or a future sink). `source` distinguishes the contact
 * form from other capture points (newsletter signup, gated downloads, a
 * future quote form) so a single sink can branch on it.
 */
export type EnquirySource = 'contact' | 'quote' | 'newsletter' | 'download' | 'other';

export interface Enquiry {
  email: string;
  name?: string;
  phone?: string;
  message?: string;
  source: EnquirySource;
  userAgent?: string | null;
}

/**
 * A destination for captured enquiries. `capture` must never throw --
 * failures are reported through the return value so callers (server
 * actions) can decide how to degrade instead of erroring the request.
 */
export interface LeadSink {
  capture(e: Enquiry): Promise<{ ok: true } | { ok: false; reason: 'invalid' | 'unconfigured' | 'error' }>;
}
