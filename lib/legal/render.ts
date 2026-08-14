import { site } from '@/site.config';
import { siteOrigin } from '@/lib/seo/site';

/** Single-line address for legal copy: "street, city, region postalCode".
 * Resolves to '' when the business has no public address — reword the legal
 * templates for such sites so sentences don't reference a blank. */
function formatAddress(): string {
  if (!site.business.address) return '';
  const { street, city, region, postalCode } = site.business.address;
  return `${street}, ${city}, ${region} ${postalCode}`;
}

/** Build date in YYYY-MM-DD, computed at render time. */
function buildDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const PLACEHOLDERS: Record<string, () => string> = {
  businessName: () => site.name,
  legalName: () => site.business.legalName,
  email: () => site.business.email,
  phone: () => site.business.phone ?? '',
  address: () => formatAddress(),
  siteUrl: () => siteOrigin(),
  date: () => buildDate(),
};

/**
 * Strips a leading HTML comment (and any whitespace after it) from a legal
 * template. Templates in content/legal/*.md open with a disclaimer comment
 * intended for anyone editing the source — it must ship in source but never
 * render: renderMarkdown has no rehype-raw plugin wired up, so an unstripped
 * HTML comment node falls through as literal escaped text instead of being
 * silently dropped. Centralized here (rather than duplicated per page) so a
 * future legal page can't forget the strip and re-leak the comment.
 */
function stripLeadingComment(text: string): string {
  return text.replace(/^\s*<!--[\s\S]*?-->\s*/, '');
}

/**
 * Substitutes `{{placeholder}}` tokens in a legal template with values from
 * `site` (see PLACEHOLDERS for the supported set), then strips the
 * template's leading disclaimer comment (see stripLeadingComment). Throws,
 * naming the placeholder, if the template references one that isn't
 * recognized — templates are hand-authored, so a typo should fail loudly
 * rather than ship a literal `{{typo}}` into a published page.
 */
export function renderLegal(template: string): string {
  const substituted = template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const resolve = PLACEHOLDERS[key];
    if (!resolve) {
      throw new Error(`renderLegal: unknown placeholder {{${key}}}`);
    }
    return resolve();
  });
  return stripLeadingComment(substituted);
}
