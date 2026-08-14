import { ImageResponse } from 'next/og';
import { monogram } from '@/lib/brand';
import { SITE } from '@/lib/seo/site';
import { themeColors } from '@/lib/theme';

/**
 * Generated favicon, served at /icon. Rebrands itself: the monogram comes
 * from `site.name` (same derivation the header uses when `site.logo` is
 * null) and the colors from `lib/theme.ts`, which the setup wizard rewrites
 * alongside app/theme.css. Nothing to redraw or re-export by hand.
 *
 * Satori can't read CSS custom properties, hence `themeColors` rather than
 * the `--color-*` tokens.
 */
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const initials = monogram(SITE.name);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: themeColors.surfaceInverse,
          color: themeColors.accent,
          borderRadius: 7,
          // Two letters at 15px fit 32px square with room to breathe; a
          // one-letter name gets the same box and simply looks larger.
          fontSize: initials.length > 1 ? 15 : 19,
          fontWeight: 700,
          letterSpacing: '-0.04em',
        }}
      >
        {initials}
      </div>
    ),
    size,
  );
}
