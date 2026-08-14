import Link from 'next/link';
import { defineCustomSection } from './define';
import { asRecord, copyFail, optString, reqArray, reqString } from './copy-utils';

type TileKind = 'media' | 'video' | 'note';

interface Tile {
  kind: TileKind;
  /** corner caption for media/video tiles */
  label?: string;
  /** mono text lines for note tiles */
  lines?: string[];
  /** tile height in px — the masonry rhythm comes from varied heights */
  height: number;
}

interface HalionCommunityCopy {
  eyebrow: string;
  heading: string;
  sub: string;
  ctas: { label: string; href: string; primary?: boolean }[];
  tiles: Tile[];
}

const stripes =
  'bg-[repeating-linear-gradient(135deg,var(--color-surface-alt),var(--color-surface-alt)_9px,var(--color-surface-inverse)_9px,var(--color-surface-inverse)_18px)]';

function HalionCommunity({ copy }: { copy: HalionCommunityCopy }) {
  return (
    <section id="community" className="border-t border-border-token/60 bg-surface-alt">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[620px] text-center">
          <div className="flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-fg">
            <span aria-hidden className="h-px w-6 bg-fg/45" />
            {copy.eyebrow}
            <span aria-hidden className="h-px w-6 bg-fg/45" />
          </div>
          <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.04] tracking-[-0.035em] text-fg">
            {copy.heading}
          </h2>
          <p className="mt-4 text-[17px] font-light leading-relaxed text-fg-muted">{copy.sub}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3.5">
            {copy.ctas.map(cta =>
              cta.primary ? (
                <Link
                  key={cta.label}
                  href={cta.href}
                  className="rounded-full bg-accent px-7 py-3 text-sm font-medium text-accent-contrast transition hover:shadow-[0_0_30px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]"
                >
                  {cta.label}
                </Link>
              ) : (
                <Link
                  key={cta.label}
                  href={cta.href}
                  className="rounded-full border border-border-token bg-surface-inverse px-7 py-3 text-sm font-medium text-fg transition hover:border-fg/25 hover:bg-surface-inverse-alt"
                >
                  {cta.label}
                </Link>
              )
            )}
          </div>
        </div>

        <div className="mt-16 columns-2 gap-[18px] sm:columns-3 lg:columns-4">
          {copy.tiles.map((tile, i) => (
            <div
              key={i}
              style={{ height: tile.height }}
              className={`relative mb-[18px] break-inside-avoid overflow-hidden rounded-xl border border-border-token ${
                tile.kind === 'note' ? 'bg-surface-inverse p-4' : stripes
              } ${tile.kind === 'video' ? 'flex items-center justify-center' : ''}`}
            >
              {tile.kind === 'video' && (
                <span
                  aria-hidden
                  className="ml-1 h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-fg"
                />
              )}
              {tile.kind === 'note' && tile.lines && (
                <span className="font-mono text-[10px] leading-[1.7] text-fg-muted/70">
                  {tile.lines.map(line => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </span>
              )}
              {tile.label && (
                <span
                  className={`absolute bottom-2.5 left-3 font-mono text-[9.5px] tracking-[0.08em] ${
                    tile.kind === 'video' ? 'text-fg-muted' : 'text-fg-muted/70'
                  }`}
                >
                  {tile.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const halionCommunity = defineCustomSection<HalionCommunityCopy>({
  Component: HalionCommunity,
  validateCopy(raw) {
    const ctx = 'halionCommunity';
    const o = asRecord(ctx, raw);
    const ctas = reqArray(ctx, o, 'ctas').map((c, i) => {
      const cc = `${ctx}.ctas[${i}]`;
      const cr = asRecord(cc, c);
      return {
        label: reqString(cc, cr, 'label'),
        href: reqString(cc, cr, 'href'),
        primary: cr.primary === true,
      };
    });
    const tiles = reqArray(ctx, o, 'tiles').map((t, i) => {
      const tc = `${ctx}.tiles[${i}]`;
      const tr = asRecord(tc, t);
      const kind = reqString(tc, tr, 'kind');
      if (kind !== 'media' && kind !== 'video' && kind !== 'note') {
        copyFail(tc, `kind must be "media", "video", or "note" (got "${kind}")`);
      }
      if (typeof tr.height !== 'number' || tr.height <= 0) copyFail(tc, 'height must be a positive number');
      const lines = tr.lines;
      if (lines !== undefined && (!Array.isArray(lines) || lines.some(l => typeof l !== 'string'))) {
        copyFail(tc, 'lines must be an array of strings when present');
      }
      return {
        kind: kind as TileKind,
        label: optString(tc, tr, 'label'),
        lines: lines as string[] | undefined,
        height: tr.height,
      };
    });
    return {
      eyebrow: reqString(ctx, o, 'eyebrow'),
      heading: reqString(ctx, o, 'heading'),
      sub: reqString(ctx, o, 'sub'),
      ctas,
      tiles,
    };
  },
});
