import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/seo/site';
import { themeColors } from '@/lib/theme';

/**
 * Generated site-wide OG fallback image, served at /opengraph-image. Routes
 * with their own imagery (post covers) override it via openGraph.images;
 * everything else falls back here. Brand tokens mirror app/theme.css via
 * `themeColors` (Satori can't read CSS custom properties).
 */
export const alt = `${SITE.name} -- ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: themeColors.surface,
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 26,
            color: themeColors.accent,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {SITE.name}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
          }}
        >
          <div
            style={{
              fontSize: 76,
              color: themeColors.fg,
              lineHeight: 1.05,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              maxWidth: 980,
            }}
          >
            {SITE.tagline}
          </div>
          <div
            style={{
              width: 220,
              height: 10,
              backgroundImage: `linear-gradient(90deg, ${themeColors.accentAlt}, ${themeColors.accent})`,
              borderRadius: 5,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
