import { Helmet } from 'react-helmet-async';

type JsonLd = Record<string, any>;

interface SeoProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  noIndex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
}

const SITE_NAME = 'NicoPatch';
const SITE_ORIGIN = 'https://nicopatch.com.au'; // Phase 2: wire to real domain config

export default function Seo({ title, description, canonicalPath, noIndex, jsonLd }: SeoProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonical = canonicalPath ? `${SITE_ORIGIN}${canonicalPath}` : undefined;

  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {jsonLdArray.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
}

export { SITE_NAME, SITE_ORIGIN };
