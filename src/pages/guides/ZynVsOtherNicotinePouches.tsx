import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Seo, { SITE_ORIGIN } from '@/components/seo/Seo';
import { articleSchema, breadcrumbSchema, faqPageSchema, webPageSchema } from '@/components/seo/schema';

const PATH = '/guides/zyn-vs-other-nicotine-pouches';

export default function GuideZynVsOtherNicotinePouches() {
  const faq = [
    {
      question: 'Is Zyn different from other nicotine pouches?',
      answer:
        'Zyn is a brand. The most important differences are usually strength options, flavour availability, and what’s clinically appropriate for you.',
    },
    {
      question: 'Can I choose any product and strength?',
      answer:
        'Strength and suitability should be clinically guided. A doctor may set a maximum strength; you can choose that strength or lower.',
    },
    {
      question: 'How much does it cost?',
      answer:
        'Costs typically include a consultation fee (shown at booking), product pricing (shown in the shop), and shipping at checkout. Pricing can change over time.',
    },
    {
      question: 'What should I do if I’m unsure?',
      answer:
        'Start with the questionnaire and book a consultation so a qualified doctor can advise you based on your history and goals.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="Zyn vs Other Nicotine Pouches: What Changes (and What Doesn’t)"
        description="Compare Zyn vs other nicotine pouches: what matters (strength, suitability, access) and how to choose the right next step in Australia."
        canonicalPath={PATH}
        ogImagePath="/og/zyn-vs-other-nicotine-pouches.png"
        ogType="article"
        jsonLd={[
          webPageSchema({
            url: `${SITE_ORIGIN}${PATH}`,
            name: 'Zyn vs other nicotine pouches',
            description:
              'Zyn is a brand of nicotine pouches. This guide explains what actually matters when comparing brands: strength, suitability, and the compliant pathway in Australia.',
            dateModified: '2026-03-30',
          }),
          articleSchema({
            url: `${SITE_ORIGIN}${PATH}`,
            siteOrigin: SITE_ORIGIN,
            headline: 'Zyn vs other nicotine pouches (Australia): what actually matters',
            description:
              'Zyn is a brand of nicotine pouches. This guide explains what actually matters when comparing brands: strength, suitability, and the compliant pathway in Australia.',
            dateModified: '2026-03-30',
          }),
          breadcrumbSchema({
            items: [
              { name: 'Home', url: `${SITE_ORIGIN}/` },
              { name: 'Guides', url: `${SITE_ORIGIN}/guides` },
              { name: 'Zyn vs other nicotine pouches', url: `${SITE_ORIGIN}${PATH}` },
            ],
          }),
          faqPageSchema({ url: `${SITE_ORIGIN}${PATH}`, questions: faq }),
        ]}
      />

      <section className="py-12 md:py-16">
        <div className="container max-w-3xl space-y-6">
          <header className="space-y-3">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Zyn vs other nicotine pouches</h1>
            <p className="text-muted-foreground">Last updated: March 2026</p>
            <p className="text-muted-foreground">
              If you’re comparing brands—especially if you searched for “Zyns Australia”—the most important factor
              is what’s clinically appropriate for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/eligibility">Start consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/guides/zyn-australia">Read: Zyn in Australia</Link>
              </Button>
            </div>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Quick answer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Zyn is a brand of nicotine pouches. When comparing brands, the most important factor is what’s
                clinically appropriate for you—especially strength and suitability.
              </p>
              <p>
                If you searched “Zyns Australia”, focus on the compliant pathway first, then choose from available
                products within your approved limits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What actually matters</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Strength:</strong> 3mg / 6mg / 9mg (doctor‑guided)</li>
                <li><strong>Suitability:</strong> depends on health history and nicotine dependence</li>
                <li><strong>Access:</strong> follow the compliant pathway for Australia</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to choose between brands</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li>Pick your strength first (based on what your doctor approves).</li>
                <li>Then choose flavour and price based on what’s available in the shop.</li>
                <li>If your goal is to step down, select a lower strength over time.</li>
              </ul>
              <p>
                If you’re unsure, start with a consultation. A qualified doctor can help guide the right strength
                and approach.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">FAQ</h2>
              <div className="space-y-4">
                {faq.map((q) => (
                  <Card key={q.question}>
                    <CardHeader>
                      <CardTitle className="text-base">{q.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{q.answer}</CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Related guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link className="text-primary underline underline-offset-4 block" to="/guides/zyn-australia">
                  Zyn in Australia
                </Link>
                <Link className="text-primary underline underline-offset-4 block" to="/guides/nicotine-pouch-strength-3mg-6mg-9mg">
                  Strength guide: 3mg vs 6mg vs 9mg
                </Link>
                <Link className="text-primary underline underline-offset-4 block" to="/guides/nicotine-pouches-australia">
                  Nicotine pouches in Australia
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next step</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Start with the questionnaire and book a consultation. A qualified doctor will make the final
                  clinical assessment.
                </p>
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/eligibility">Start consultation</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
