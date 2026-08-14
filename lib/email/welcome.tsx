import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Heading,
  Button,
  Hr,
  Link,
} from 'react-email';
import { themeColors } from '@/lib/theme';
import { site } from '@/site.config';

/**
 * Post-signup welcome email. Email clients need inline styles; these tokens
 * mirror the brand palette in app/theme.css via lib/theme.ts.
 */
export interface WelcomeEmailProps {
  /** Lead source ('contact' | 'newsletter' | 'quote' | 'download' | 'other'). */
  source: string;
  /** Absolute URL the download CTA button points at. */
  downloadUrl: string;
  /** Absolute, signed per-lead unsubscribe URL. */
  unsubscribeUrl: string;
}

/** One-line street/city/region/postal address, or null if none is set. */
function addressLine(): string | null {
  const a = site.business.address;
  if (!a) return null;
  const parts = [a.street, a.city, a.region, a.postalCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function WelcomeEmail({ source, downloadUrl, unsubscribeUrl }: WelcomeEmailProps) {
  const isDownload = source === 'download';
  const address = addressLine();

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {isDownload ? 'Your download is ready.' : "You're on the list."}
      </Preview>
      <Body
        style={{
          backgroundColor: themeColors.surface,
          fontFamily: 'Helvetica, Arial, sans-serif',
          margin: 0,
          padding: 0,
        }}
      >
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 24px' }}>
          <Text
            style={{
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: themeColors.accent,
              margin: 0,
            }}
          >
            {site.name}
          </Text>

          <Heading
            style={{
              fontSize: '28px',
              lineHeight: '1.15',
              color: themeColors.fg,
              marginTop: '16px',
              marginBottom: '12px',
              fontWeight: 600,
            }}
          >
            Thanks for signing up
          </Heading>

          <Text
            style={{
              fontSize: '15px',
              lineHeight: '1.6',
              color: themeColors.fgMuted,
              margin: 0,
            }}
          >
            {isDownload
              ? 'Your download is ready.'
              : `You're on the list. ${site.tagline}`}
          </Text>

          <Button
            href={downloadUrl}
            style={{
              backgroundColor: themeColors.accent,
              color: themeColors.accentContrast,
              fontSize: '15px',
              fontWeight: 600,
              padding: '12px 28px',
              borderRadius: '999px',
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: '28px',
            }}
          >
            {isDownload ? 'Download now' : `Visit ${site.name}`}
          </Button>

          <Hr style={{ borderColor: themeColors.borderToken, marginTop: '36px', marginBottom: '16px' }} />

          <Text style={{ fontSize: '12px', lineHeight: '1.6', color: themeColors.fgMuted, margin: 0 }}>
            {site.business.legalName}
            {address ? ` · ${address}` : ''}
          </Text>
          <Text style={{ fontSize: '12px', lineHeight: '1.6', color: themeColors.fgMuted, margin: '4px 0 0' }}>
            You&apos;re receiving this because you signed up at {site.name}.{' '}
            <Link
              href={unsubscribeUrl}
              style={{ color: themeColors.fgMuted, textDecoration: 'underline' }}
            >
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
