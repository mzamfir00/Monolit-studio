/**
 * Renders schema.org data as a JSON-LD script. "<" is escaped so text from the catalogue (edited in the admin)
 * can never close the script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}
