import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Seo, { SITE_ORIGIN } from '@/components/seo/Seo';
import { breadcrumbSchema, faqPageSchema } from '@/components/seo/schema';

const PATH = '/guides/nicotine-pouch-strength-3mg-6mg-9mg';

export default function GuideNicotinePouchStrengthGuide() {
  const faq = [
    {
      question: 'What strength should I choose: 3mg, 6mg or 9mg?',
      answer:
        'The right strength depends on your nicotine dependence, prior use, and health factors. A doctor can help choose what is clinically appropriate for you.',
    },
    {
      question: 'Can I order a higher strength than approved?',
      answer:
        'No. If a maximum strength is set for you, you can order that strength or lower (step down), but not higher.',
    },
    {
      question: 'Can I reduce strength later?',
      answer:
        'Yes, many people step down over time. A consultation is the right place to discuss an appropriate plan.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="3mg vs 6mg vs 9mg Nicotine Pouches: Strength Guide (Australia)"
        description="A simple guide to nicotine pouch strengths (3mg, 6mg, 9mg) in Australia and how a doctor helps choose what’s appropriate."
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
              Nicotine pouch strengths: 3mg vs 6mg vs 9mg
            </h1>
            <p className="text-muted-foreground">Last updated: March 2026</p>
            <p className="text-muted-foreground">
              Strength choice should be personalised. This guide explains the differences at a high level and why
              a doctor’s assessment matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/eligibility">Start consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/guides/nicotine-pouches-australia">Read: Nicotine pouches in Australia</Link>
              </Button>
            </div>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Quick comparison</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>3mg:</strong> lower strength (often suitable for stepping down)</li>
                <li><strong>6mg:</strong> mid strength</li>
                <li><strong>9mg:</strong> higher strength (only if clinically appropriate)</li>
              </ul>
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
