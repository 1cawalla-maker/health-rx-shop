import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Seo, { SITE_ORIGIN } from '@/components/seo/Seo';
import { breadcrumbSchema, faqPageSchema } from '@/components/seo/schema';

const PATH = '/guides/how-to-get-nicotine-pouches-in-australia';

export default function GuideHowToGetNicotinePouchesAustralia() {
  const faq = [
    {
      question: 'How do I get nicotine pouches in Australia?',
      answer:
        'Start with the questionnaire, then book a telehealth consultation. If clinically appropriate, a doctor will guide you through the compliant next steps.',
    },
    {
      question: 'Do I choose a doctor?',
      answer:
        'You select a time. A doctor is assigned after booking confirmation.',
    },
    {
      question: 'How long does it take?',
      answer:
        'Timeframes vary. The fastest way to start is to complete the questionnaire and book a consultation time that suits you.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="How to Get Nicotine Pouches in Australia (Step‑by‑Step)"
        description="Step-by-step: how to get nicotine pouches in Australia via a compliant, doctor-supervised telehealth pathway."
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
              How to get nicotine pouches in Australia
            </h1>
            <p className="text-muted-foreground">Last updated: March 2026</p>
            <p className="text-muted-foreground">
              If you’re searching “how to get nicotine pouches in Australia”, here’s the simplest compliant path.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/eligibility">Start consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/how-it-works">How it works</Link>
              </Button>
            </div>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Step-by-step</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Complete the short questionnaire.</li>
                <li>Book a consultation time that suits you.</li>
                <li>A qualified doctor assesses suitability during your consultation.</li>
                <li>If clinically appropriate, next steps are explained and access is enabled.</li>
              </ol>
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
                <CardTitle>Ready to start?</CardTitle>
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
