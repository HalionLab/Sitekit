import { Html, Head, Preview, Body, Container, Section, Text, Heading, Hr } from 'react-email';
import { themeColors } from '@/lib/theme';

export interface EnquiryEmailProps {
  /** EnquirySource ('contact' | 'quote' | 'newsletter' | 'download' | 'other'). */
  source: string;
  siteName: string;
  name?: string;
  email: string;
  phone?: string;
  message?: string;
}

/**
 * Internal notification sent to the business owner when a visitor submits
 * the contact form (email-sink mode -- no Supabase/leads table). Plain,
 * legible in any email client; themed with `themeColors` since CSS custom
 * properties don't reach email clients.
 */
export function EnquiryEmail({ source, siteName, name, email, phone, message }: EnquiryEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`New ${source} enquiry from ${siteName} website`}</Preview>
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
            {siteName}
          </Text>

          <Heading
            style={{
              fontSize: '24px',
              lineHeight: '1.2',
              color: themeColors.fg,
              marginTop: '16px',
              marginBottom: '4px',
              fontWeight: 600,
            }}
          >
            New {source} enquiry
          </Heading>
          <Text style={{ fontSize: '13px', color: themeColors.fgMuted, margin: 0 }}>
            Submitted from the {siteName} website.
          </Text>

          <Hr style={{ borderColor: themeColors.borderToken, marginTop: '24px', marginBottom: '20px' }} />

          <Row label="Name" value={name || '—'} />
          <Row label="Email" value={email} />
          <Row label="Phone" value={phone || '—'} />

          <Section style={{ marginTop: '16px' }}>
            <Text
              style={{
                fontSize: '12px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: themeColors.fgMuted,
                margin: 0,
              }}
            >
              Message
            </Text>
            <Text
              style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: themeColors.fg,
                margin: '6px 0 0',
                whiteSpace: 'pre-wrap',
              }}
            >
              {message || '—'}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Section style={{ marginTop: '12px' }}>
      <Text
        style={{
          fontSize: '12px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: themeColors.fgMuted,
          margin: 0,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: '15px', color: themeColors.fg, margin: '2px 0 0' }}>{value}</Text>
    </Section>
  );
}
