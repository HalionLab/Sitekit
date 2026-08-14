import type { ReactNode } from 'react';
import { notFoundUnless, features } from '@/lib/config/features';

/**
 * Single gate for every `/admin/**` route: 404s the whole segment when the
 * `cms` feature is off, instead of repeating the check in each page.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  notFoundUnless(features.cms);
  return <>{children}</>;
}
