import { Helmet } from 'react-helmet-async';

type JsonLd = Record<string, any>;

interface SeoProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  noIndex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
  ogImagePath?: string;
  ogType?: 'website' | 'article';
}

const SITE_NAME = 'NicoPatch';

// IMPORTANT: use env when available so Preview/dev don't emit incorrect canonical URLs.
// Vite exposes env vars as import.meta.env.* at build time.
const SITE_ORIGIN: string = (import.meta as any)?.env?.VITE_SITE_ORIGIN || 'https://nicopatch.com.au';

export default function Seo({ title, description, canonicalPath, noIndex, jsonLd, ogImagePath, ogType = 'website' }: SeoProps) {
  const hasTitle = Boolean(title && title.trim());
  const fullTitle = hasTitle
    ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`)
    : '';

  const canonical = canonicalPath ? `${SITE_ORIGIN}${canonicalPath}` : undefined;

  // Default to a stable placeholder image for indexed pages so shares render consistently,
  // while ensuring noindex/untitled routes don't emit OG images.
  const ogImage = !noIndex && hasTitle
    ? `${SITE_ORIGIN}${ogImagePath || '/placeholder.svg'}`
    : undefined;

  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      {hasTitle && <title>{fullTitle}</title>}
      {description && <meta name="description" content={description} />}
      {!noIndex && hasTitle && <meta name="author" content={SITE_NAME} />}
      {!noIndex && <meta httpEquiv="content-language" content="en-AU" />}
      {canonical && <link rel="canonical" href={canonical} />}
      {canonical && <link rel="alternate" hrefLang="en-au" href={canonical} />}
      {canonical && <link rel="alternate" hrefLang="x-default" href={canonical} />}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {/* OpenGraph / Twitter */}
      {canonical && <meta property="og:url" content={canonical.replace(/\/$/, '')} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_AU" />
      <meta property="og:type" content={ogType} />
      {hasTitle && <meta property="og:title" content={fullTitle} />}
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta property="og:image:alt" content={hasTitle ? fullTitle : SITE_NAME} />}
      {ogImage && <meta property="og:image:width" content="1200" />}
      {ogImage && <meta property="og:image:height" content="630" />}

      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      {hasTitle && <meta name="twitter:title" content={fullTitle} />}
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {ogImage && <meta name="twitter:image:alt" content={hasTitle ? fullTitle : SITE_NAME} />}

      {jsonLdArray.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
}

export { SITE_NAME, SITE_ORIGIN };
