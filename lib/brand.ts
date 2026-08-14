/**
 * Brand marks derived from `site.name`, shared by every surface that needs a
 * logo stand-in: the header (when `site.logo` is null) and the generated
 * favicon (app/icon.tsx). Kept here, dependency-free, so the icon route
 * doesn't have to import a React component to reuse the same derivation.
 */

/** First letter of the first two words of the site name, e.g. "Summit Services" -> "SS". */
export function monogram(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0] ?? '')
    .join('')
    .toUpperCase();
}
