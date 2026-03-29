export function faqPageSchema(params: {
  url: string;
  questions: Array<{ question: string; answer: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': params.url,
    url: params.url,
    inLanguage: 'en-AU',
    mainEntity: params.questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export function breadcrumbSchema(params: {
  items: Array<{ name: string; url: string }>;
}) {
  const id = params.items.length ? `${params.items[params.items.length - 1].url}#breadcrumb` : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    ...(id ? { '@id': id } : {}),
    inLanguage: 'en-AU',
    itemListElement: params.items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function webPageSchema(params: {
  url: string;
  name: string;
  description?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': params.url,
    url: params.url,
    name: params.name,
    description: params.description,
    inLanguage: 'en-AU',
  };
}

export function articleSchema(params: {
  url: string;
  headline: string;
  description?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': params.url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url,
    },
    url: params.url,
    headline: params.headline,
    description: params.description,
    dateModified: params.dateModified,
    inLanguage: 'en-AU',
    author: {
      '@type': 'Organization',
      name: 'NicoPatch',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NicoPatch',
    },
  };
}

export function serviceSchema(params: {
  url: string;
  name: string;
  description?: string;
  providerUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${params.url}#service`,
    url: params.url,
    name: params.name,
    description: params.description,
    provider: {
      '@type': 'Organization',
      name: 'NicoPatch',
      url: params.providerUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Australia',
    },
    inLanguage: 'en-AU',
  };
}
