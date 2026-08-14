import { notFound } from 'next/navigation';
import { site } from '@/site.config';

export const features = site.features;

/** Call at the top of a gated page/layout: 404s the whole segment when off. */
export function notFoundUnless(enabled: boolean): void {
  if (!enabled) notFound();
}

/** For route handlers, which must return a Response. */
export function disabledResponse(): Response {
  return new Response('Not found', { status: 404 });
}
