'use client';

import { themeColors } from '@/lib/theme';

/**
 * Root-level error boundary. Next renders this in place of the entire root
 * layout when an error escapes it, so it must supply its own <html>/<body>
 * — and since the layout (and its stylesheet) may not have loaded, every
 * style here is inline, sourced from lib/theme.ts rather than Tailwind
 * classes.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 1.5rem',
          backgroundColor: themeColors.surface,
          color: themeColors.fg,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: '1rem', color: themeColors.fgMuted }}>
            Try again, or head back home.
          </p>
          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                border: 'none',
                padding: '0.75rem 1.5rem',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                backgroundColor: themeColors.accent,
                color: themeColors.accentContrast,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error
                replaces the root layout, so no router context is guaranteed to be
                present; next/link cannot be relied on here. A plain full navigation
                to "/" is intentional. */}
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                border: `1px solid ${themeColors.borderToken}`,
                padding: '0.75rem 1.5rem',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                color: themeColors.fg,
                textDecoration: 'none',
              }}
            >
              Back home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
