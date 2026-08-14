const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

export function isValidEmail(s: string): boolean {
  if (typeof s !== 'string' || s.length === 0 || s.length > 254) return false;
  return EMAIL_RE.test(s);
}
