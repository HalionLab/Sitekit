import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, isAdminEmail } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Leads — Admin',
  robots: { index: false, follow: false },
};

// Reads cookies (auth) and ?page/?source — always render at request time.
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

// Mirrors the leads.source CHECK constraint in 0001_init.sql.
const SOURCES = ['contact', 'newsletter', 'quote', 'download', 'other'] as const;
type Source = (typeof SOURCES)[number];

interface LeadRow {
  id: string;
  email: string;
  source: string;
  notes: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

interface Props {
  searchParams: Promise<{ source?: string; page?: string }>;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const SOURCE_LABELS: Record<Source, string> = {
  contact: 'Contact',
  newsletter: 'Newsletter',
  quote: 'Quote',
  download: 'Download',
  other: 'Other',
};

export default async function AdminLeadsPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!isAdminEmail(user?.email)) {
    redirect('/login');
  }

  const sp = await searchParams;
  const source: Source | null =
    sp.source && (SOURCES as readonly string[]).includes(sp.source)
      ? (sp.source as Source)
      : null;
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const sb = createAdminClient();
  let query = sb
    .from('leads')
    .select('id,email,source,notes,unsubscribed_at,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (source) query = query.eq('source', source);

  const { data, count, error } = await query;
  if (error) throw new Error(`AdminLeadsPage: ${error.message}`);

  const leads = (data ?? []) as LeadRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Preserve the active source filter across the Export link and pagination.
  const withParams = (extra: Record<string, string>) => {
    const params = new URLSearchParams({
      ...(source ? { source } : {}),
      ...extra,
    });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };
  const exportHref = `/api/admin/leads/export${source ? `?source=${source}` : ''}`;

  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/admin"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent transition hover:text-fg"
        >
          <span aria-hidden>&larr; </span>Admin
        </Link>

        {/* Header */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              Admin
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight">Leads</h1>
          </div>
          <a
            href={exportHref}
            className="rounded-full border border-fg/20 px-5 py-2.5 text-sm font-medium text-fg transition hover:border-fg/40 hover:bg-surface-inverse/5"
          >
            Export CSV
          </a>
        </div>

        {/* Source filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          <FilterChip href="/admin/leads" active={source === null} label="All" />
          {SOURCES.map((s) => (
            <FilterChip
              key={s}
              href={`/admin/leads?source=${s}`}
              active={source === s}
              label={SOURCE_LABELS[s]}
            />
          ))}
        </div>

        {/* List */}
        <div className="mt-8">
          {leads.length === 0 ? (
            <div className="rounded-2xl border border-fg/10 bg-white px-6 py-12 text-center">
              <p className="text-sm text-fg/55">
                {source
                  ? `No ${SOURCE_LABELS[source]} leads yet.`
                  : 'No leads yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-fg/10 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-fg/10 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-fg/55">
                    <th className="px-5 py-3 font-normal">Email</th>
                    <th className="px-3 py-3 font-normal">Source</th>
                    <th className="px-3 py-3 font-normal">Created</th>
                    <th className="px-3 py-3 font-normal">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fg/8">
                  {leads.map((lead) => {
                    const unsubscribed = lead.unsubscribed_at !== null;
                    return (
                      <tr key={lead.id} className="align-top">
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-all text-fg">{lead.email}</span>
                            {unsubscribed && (
                              <span
                                title={`Unsubscribed ${formatDateTime(lead.unsubscribed_at!)}`}
                                className="inline-flex shrink-0 items-center rounded-full bg-surface-inverse/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-fg/55"
                              >
                                Unsubscribed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-fg/70">
                          {lead.source}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-fg/55">
                          {formatDateTime(lead.created_at)}
                        </td>
                        <td className="px-3 py-3 text-xs text-fg/70">
                          {lead.notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-fg/55">
            {total} {total === 1 ? 'lead' : 'leads'} · Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-4">
            {page > 1 && (
              <Link
                href={`/admin/leads${withParams({ page: String(page - 1) })}`}
                className="text-accent transition hover:text-fg"
              >
                <span aria-hidden>&larr; </span>Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/leads${withParams({ page: String(page + 1) })}`}
                className="text-accent transition hover:text-fg"
              >
                Next<span aria-hidden> &rarr;</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={[
        'rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition',
        active
          ? 'bg-surface-inverse text-fg-inverse'
          : 'bg-surface-inverse/5 text-fg/60 hover:bg-surface-inverse/10 hover:text-fg',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}
