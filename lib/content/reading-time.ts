const WORDS_PER_MINUTE = 200;

/**
 * Estimate reading time for a markdown string, in whole minutes, rounded to the
 * nearest minute with a floor of 1 (empty or whitespace-only input returns 1).
 *
 * Word counting is intentionally cheap: split on whitespace, strip each token of
 * non-alphanumeric characters, and drop tokens that are left empty. This keeps
 * markdown syntax (`##`, `-`, `>`, etc.) from inflating the count without paying
 * to fully parse the markdown — accuracy at 1-minute resolution doesn't need it.
 */
export function getReadingTimeMinutes(markdown: string): number {
  const wordCount = markdown
    .split(/\s+/)
    .map(token => token.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(token => token.length > 0).length;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}
