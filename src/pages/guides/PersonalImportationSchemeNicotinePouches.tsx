import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Seo, { SITE_ORIGIN } from '@/components/seo/Seo';
import { breadcrumbSchema, faqPageSchema } from '@/components/seo/schema';

const PATH = '/guides/personal-importation-scheme-nicotine-pouches';

export default function GuidePersonalImportationSchemeNicotinePouches() {
  const faq = [
    {
      question: 'What is the Personal Importation Scheme?',
      answer:
        'It’s a framework that can apply to certain goods imported for personal use. The details depend on the product and current rules.',
    },
    {
      question: 'Does the Personal Importation Scheme apply to nicotine pouches?',
      answer:
        'It may apply depending on product specifics and current regulations. A doctor-supervised pathway helps ensure you follow the compliant steps for your situation.',
    },
    {
      question: 'What is the safest next step?',
      answer:
        'Complete the questionnaire and book a consultation so a qualified doctor can assess suitability and explain the appropriate pathway.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="Personal Importation Scheme: Nicotine Pouches in Australia (Guide)"
        description="Plain-English guide to the Personal Importation Scheme and how it relates to nicotine pouches in Australia, with a doctor-supervised next step."
        canonicalPath={PATH}
        jsonLd={[
          breadcrumbSchema({
            items: [
              { name: 'Home', url: `${SITE_ORIGIN}/` },
              { name: 'Guides', url: `${SITE_ORIGIN}${PATH}` },
            ],
          }),
          faqPageSchema({ url: `${SITE_ORIGIN}${PATH}`, questions: faq }),
        ]}
      />

      <section className="py-12 md:py-16">
        <div className="container max-w-3xl space-y-6">
          <header className="space-y-3">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Personal Importation Scheme for nicotine pouches
            </h1>
            <p className="text-muted-foreground">Last updated: March 2026</p>
            <p className="text-muted-foreground">
              This page provides general information only. Regulations can change and the right pathway depends on
              your circumstances.
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
              <CardTitle>Plain-English summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                The Personal Importation Scheme is often discussed in relation to nicotine products. Because rules
                can be nuanced and may change, the safest step is a doctor-supervised pathway where a clinician can
                explain what’s appropriate for you.
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
