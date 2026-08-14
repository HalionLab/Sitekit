import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { disabledResponse, features } from '@/lib/config/features';

/**
 * Admin-only CSV export of captured leads.
 *
 * Auth: requireAdmin() must pass before anything else runs; failures return a
 * bare 404 (matching the draft routes) so the endpoint leaks no signal about
 * its existence or the session state.
 *
 * PII: the response carries raw email addresses. It is gated, marked
 * `Cache-Control: no-store` so no browser/CDN retains it, and deliberately
 * excludes the internal `ip_hash` / `user_agent` columns.
 *
 * Size: rows are capped at MAX_ROWS to bound memory, and the body is streamed
 * (not buffered into one string) so the response stays under the platform's
 * buffered-response limit even near the cap. If the cap is ever hit we log it
 * rather than silently truncating — that's the signal to move to paginated
 * streaming straight from the DB.
 */

export const dynamic = 'force-dynamic';

const SOURCES = ['contact', 'newsletter', 'quote', 'download', 'other'];
const MAX_ROWS = 50_000;

const COLUMNS = ['email', 'source', 'created_at', 'unsubscribed_at', 'notes'] as const;

interface ExportRow {
  email: string;
  source: string;
  created_at: string;
  unsubscribed_at: string | null;
  notes: string | null;
}

/**
 * RFC 4180 quoting plus a spreadsheet formula-injection guard.
 *
 * Excel/Sheets/LibreOffice treat a cell starting with `=`, `+`, `-`, or `@`
 * as a formula when the CSV is opened, so a lead-captured name/email/notes
 * value like `=HYPERLINK(...)` would execute in the admin's spreadsheet.
 * Prefix a literal single quote to force text interpretation -- applied to
 * the raw value first, before the RFC 4180 comma/quote/CR/LF quoting so the
 * guard character is protected the same way any other leading character
 * would be.
 */
export function escapeCsv(value: string | null | undefined): string {
  if (value == null) return '';
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

function toCsvLine(row: ExportRow): string {
  return COLUMNS.map((col) => escapeCsv(row[col])).join(',');
}

export async function GET(request: NextRequest) {
  if (!features.cms) return disabledResponse();

  try {
    await requireAdmin();
  } catch {
    return new Response(null, { status: 404 });
  }

  const sourceParam = request.nextUrl.searchParams.get('source');
  const source = sourceParam && SOURCES.includes(sourceParam) ? sourceParam : null;

  const sb = createAdminClient();
  let query = sb
    .from('leads')
    .select(COLUMNS.join(','))
    .order('created_at', { ascending: false })
    .range(0, MAX_ROWS - 1);
  if (source) query = query.eq('source', source);

  const { data, error } = await query;
  if (error) {
    console.error('admin.leads_export_failed', error.message);
    return new Response('Export failed.', { status: 500 });
  }

  const rows = (data ?? []) as unknown as ExportRow[];
  if (rows.length === MAX_ROWS) {
    console.warn(
      `admin.leads_export_capped rows=${MAX_ROWS} source=${source ?? 'all'} — ` +
        'export truncated at cap; switch to paginated streaming.',
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(COLUMNS.join(',') + '\n'));
      for (const row of rows) {
        controller.enqueue(encoder.encode(toCsvLine(row) + '\n'));
      }
      controller.close();
    },
  });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${ts}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
