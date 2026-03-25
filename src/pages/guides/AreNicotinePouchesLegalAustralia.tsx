import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Seo, { SITE_ORIGIN } from '@/components/seo/Seo';
import { breadcrumbSchema, faqPageSchema } from '@/components/seo/schema';

const PATH = '/guides/are-nicotine-pouches-legal-in-australia';

export default function GuideAreNicotinePouchesLegalAustralia() {
  const faq = [
    {
      question: 'Are nicotine pouches legal in Australia?',
      answer:
        'Regulations around nicotine products can be complex and may change. The safest approach is to use a doctor‑supervised pathway where a clinician can explain the compliant options available to you.',
    },
    {
      question: 'Do I need a prescription?',
      answer:
        'Many nicotine products require medical oversight. A consultation allows a doctor to assess suitability and advise on the appropriate pathway.',
    },
    {
      question: 'What should I do next?',
      answer:
        'Start with the questionnaire and book a telehealth consultation. A qualified doctor will make the final clinical assessment.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="Are Nicotine Pouches Legal in Australia? (Plain‑English Answer)"
        description="A plain-English overview of nicotine pouch legality in Australia and the safest next step: a doctor-supervised consultation pathway."
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
              Are nicotine pouches legal in Australia?
            </h1>
            <p className="text-muted-foreground">Last updated: March 2026</p>
            <p className="text-muted-foreground">
              The short version: rules around nicotine products can be complex. The safest approach is a
              doctor‑supervised pathway so you get advice that fits your situation.
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
              <CardTitle>Plain-English overview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                We don’t provide legal advice. What we do provide is a compliant, doctor‑supervised pathway where a
                qualified clinician assesses suitability and explains next steps.
              </p>
              <p>
                If you’re unsure how nicotine pouches apply to you, the simplest step is to complete the
                questionnaire and book a consultation.
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
                  Start the questionnaire and book a consultation. A qualified doctor will make the final clinical
                  assessment.
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
