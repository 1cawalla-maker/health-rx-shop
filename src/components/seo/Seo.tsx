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

  // When used for global JSON-LD only (e.g. GlobalSchema), avoid emitting duplicate/conflicting meta tags.
  const schemaOnly = !hasTitle && !description && !canonicalPath && noIndex === undefined && !ogImagePath;

  const canonical = canonicalPath
    ? (canonicalPath === '/'
        ? `${SITE_ORIGIN}/`
        : `${SITE_ORIGIN}${canonicalPath.replace(/\/+$/, '')}`)
    : undefined;

  // Default to a stable placeholder image for indexed pages so shares render consistently,
  // while ensuring noindex/untitled routes don't emit OG images.
  const ogImage = !noIndex && hasTitle
    ? `${SITE_ORIGIN}${ogImagePath || '/placeholder.svg'}`
    : undefined;

  const ogImageIsRaster = Boolean(ogImage && ogImage.match(/\.(png|jpe?g|webp)(\?.*)?$/i));
  const ogImageMime = ogImage?.match(/\.png(\?.*)?$/i)
    ? 'image/png'
    : ogImage?.match(/\.jpe?g(\?.*)?$/i)
      ? 'image/jpeg'
      : ogImage?.match(/\.webp(\?.*)?$/i)
        ? 'image/webp'
        : undefined;

  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      {hasTitle && <title>{fullTitle}</title>}
      {description && <meta name="description" content={description} />}
      {!schemaOnly && !noIndex && hasTitle && <meta name="author" content={SITE_NAME} />}
      {!schemaOnly && !noIndex && <meta httpEquiv="content-language" content="en-AU" />}
      {!schemaOnly && !noIndex && canonical && <link rel="canonical" href={canonical} />}
      {!schemaOnly && !noIndex && canonical && <link rel="alternate" hrefLang="en-au" href={canonical} />}
      {!schemaOnly && !noIndex && canonical && <link rel="alternate" hrefLang="x-default" href={canonical} />}
      {!schemaOnly && (noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      ))}

      {/* OpenGraph / Twitter */}
      {!schemaOnly && !noIndex && canonical && <meta property="og:url" content={canonical.replace(/\/+$/, '')} />}
      {!schemaOnly && <meta property="og:site_name" content={SITE_NAME} />}
      {!schemaOnly && <meta property="og:locale" content="en_AU" />}
      {!schemaOnly && <meta property="og:type" content={ogType} />}
      {!schemaOnly && hasTitle && <meta property="og:title" content={fullTitle} />}
      {!schemaOnly && description && <meta property="og:description" content={description} />}
      {!schemaOnly && ogImage && <meta property="og:image" content={ogImage} />}
      {!schemaOnly && ogImage && <meta property="og:image:secure_url" content={ogImage} />}
      {!schemaOnly && ogImageMime && <meta property="og:image:type" content={ogImageMime} />}
      {!schemaOnly && ogImage && <meta property="og:image:alt" content={hasTitle ? fullTitle : SITE_NAME} />}
      {!schemaOnly && ogImageIsRaster && <meta property="og:image:width" content="1200" />}
      {!schemaOnly && ogImageIsRaster && <meta property="og:image:height" content="630" />}

      {!schemaOnly && <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />}
      {!schemaOnly && hasTitle && <meta name="twitter:title" content={fullTitle} />}
      {!schemaOnly && description && <meta name="twitter:description" content={description} />}
      {!schemaOnly && ogImage && <meta name="twitter:image" content={ogImage} />}
      {!schemaOnly && ogImage && <meta name="twitter:image:alt" content={hasTitle ? fullTitle : SITE_NAME} />}

      {jsonLdArray.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
}

export { SITE_NAME, SITE_ORIGIN };
