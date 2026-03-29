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
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
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
