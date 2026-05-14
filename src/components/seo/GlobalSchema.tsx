import Seo, { SITE_ORIGIN, SITE_NAME } from './Seo';

const SUPPORT_EMAIL: string = (import.meta as any)?.env?.VITE_SUPPORT_EMAIL || 'support@pouchcare.com.au';

// Adds global Organization + WebSite schema once for the whole app.
// Keep public-safe; avoid listing private addresses/identifiers until confirmed.
export default function GlobalSchema() {
  return (
    <Seo
      title=""
      // No meta tags; only JSON-LD. Title is ignored because we don't render <title> when empty.
      jsonLd={[
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': `${SITE_ORIGIN}#organization`,
          name: SITE_NAME,
          url: SITE_ORIGIN,
          inLanguage: 'en-AU',
          contactPoint: [
            {
              '@type': 'ContactPoint',
              contactType: 'customer support',
              email: SUPPORT_EMAIL,
              availableLanguage: ['en-AU'],
            },
          ],
          // logo can be added later once we have a stable asset path
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': `${SITE_ORIGIN}#website`,
          name: SITE_NAME,
          url: SITE_ORIGIN,
          inLanguage: 'en-AU',
          publisher: {
            '@id': `${SITE_ORIGIN}#organization`,
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_ORIGIN}/guides?query={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        },
      ]}
    />
  );
}
