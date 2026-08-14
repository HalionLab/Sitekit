const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(s: string): boolean {
  if (typeof s !== 'string' || s.length === 0 || s.length > 120) return false;
  return SLUG_RE.test(s);
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
