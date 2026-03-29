import Seo, { SITE_ORIGIN } from './Seo';

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
          name: 'NicoPatch',
          url: SITE_ORIGIN,
          inLanguage: 'en-AU',
          contactPoint: [
            {
              '@type': 'ContactPoint',
              contactType: 'customer support',
              email: 'support@nicopatch.com.au',
              availableLanguage: ['en-AU'],
            },
          ],
          // logo can be added later once we have a stable asset path
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'NicoPatch',
          url: SITE_ORIGIN,
          inLanguage: 'en-AU',
        },
      ]}
    />
  );
}
