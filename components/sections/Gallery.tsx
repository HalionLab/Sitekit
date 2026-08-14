import { EyebrowLabel } from '@/components/ui/EyebrowLabel';
import type { GalleryCopy } from '@/lib/config/types';

export function Gallery({ copy }: { copy: GalleryCopy }) {
  return (
    <section id="gallery" className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 lg:py-28">
        {copy.eyebrow && <EyebrowLabel>{copy.eyebrow}</EyebrowLabel>}
        <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight max-w-3xl">
          {copy.heading}
        </h2>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {copy.images.map(image => (
            <div key={image.src} className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface-alt">
              {/* eslint-disable-next-line @next/next/no-img-element -- gallery images vary in
                  source/dimensions (uploads, placeholders); next/image doesn't fit this content. */}
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
