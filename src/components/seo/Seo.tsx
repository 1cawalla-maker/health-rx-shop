import { Helmet } from 'react-helmet-async';

type JsonLd = Record<string, any>;

interface SeoProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  noIndex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
  ogImagePath?: string;
}

const SITE_NAME = 'NicoPatch';

// IMPORTANT: use env when available so Preview/dev don't emit incorrect canonical URLs.
// Vite exposes env vars as import.meta.env.* at build time.
const SITE_ORIGIN: string = (import.meta as any)?.env?.VITE_SITE_ORIGIN || 'https://nicopatch.com.au';

export default function Seo({ title, description, canonicalPath, noIndex, jsonLd, ogImagePath }: SeoProps) {
  const hasTitle = Boolean(title && title.trim());
  const fullTitle = hasTitle
    ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`)
    : '';

  const canonical = canonicalPath ? `${SITE_ORIGIN}${canonicalPath}` : undefined;
  const ogImage = ogImagePath ? `${SITE_ORIGIN}${ogImagePath}` : undefined;

  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      {hasTitle && <title>{fullTitle}</title>}
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* OpenGraph / Twitter */}
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      {hasTitle && <meta property="og:title" content={fullTitle} />}
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      {hasTitle && <meta name="twitter:title" content={fullTitle} />}
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {jsonLdArray.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
}

export { SITE_NAME, SITE_ORIGIN };
