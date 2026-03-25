import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Seo, { SITE_ORIGIN } from '@/components/seo/Seo';
import { breadcrumbSchema, faqPageSchema } from '@/components/seo/schema';

const PATH = '/guides/nicotine-pouches-australia';

export default function GuideNicotinePouchesAustralia() {
  const faq = [
    {
      question: 'Do nicotine pouches require a prescription in Australia?',
      answer:
        'Rules for nicotine products can be complex. A doctor can assess your situation and explain the compliant pathway available to you.',
    },
    {
      question: 'How do I get nicotine pouches in Australia?',
      answer:
        'Start with the questionnaire and book a telehealth consultation. A qualified doctor will assess suitability and guide next steps if clinically appropriate.',
    },
    {
      question: 'How long does delivery take?',
      answer:
        'Timeframes vary based on clinical suitability and shipping. We provide updates in your account once an order is placed.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="Nicotine Pouches in Australia: Legal Access, Prescriptions & Delivery"
        description="A plain-English guide to nicotine pouches in Australia: how access works, prescriptions, consultations, and what to do next."
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
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Nicotine pouches in Australia</h1>
            <p className="text-muted-foreground">Last updated: March 2026</p>
            <p className="text-muted-foreground">
              This guide explains what nicotine pouches are, how access works in Australia, and the safest next
              step if you’re considering them.
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
              <CardTitle>What are nicotine pouches?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Nicotine pouches are placed in the mouth (between gum and lip) and deliver nicotine without smoking
                or vaping.
              </p>
              <p>
                The right product and strength depend on your health history and nicotine dependence—this is best
                discussed with a doctor.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">How access works in Australia</h2>
              <p className="text-muted-foreground">
                Nicotine products are regulated. We provide a doctor‑supervised pathway that starts with a short
                questionnaire and a telehealth consultation.
              </p>
            </div>

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
