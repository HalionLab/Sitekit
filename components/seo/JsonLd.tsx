/**
 * Renders a JSON-LD structured-data block. A native <script> tag is the right
 * tool here (not next/script): JSON-LD is data, not executable code. The
 * payload escapes `<` to its unicode form so content-derived strings can never
 * break out of the script element (`</script>` injection).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
