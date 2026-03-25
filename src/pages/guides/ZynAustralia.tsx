import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Seo from '@/components/seo/Seo';
import { breadcrumbSchema, faqPageSchema } from '@/components/seo/schema';
import { SITE_ORIGIN } from '@/components/seo/Seo';

const PATH = '/guides/zyn-australia';

export default function GuideZynAustralia() {
  const faq = [
    {
      question: 'Are Zyns legal in Australia?',
      answer:
        'Australian rules around nicotine products can be complex. The safest way to access nicotine pouches is via a compliant, doctor‑supervised pathway where a clinician assesses whether it is appropriate for you.',
    },
    {
      question: 'How can I get Zyns in Australia legally?',
      answer:
        'If clinically appropriate, a doctor can assess you via telehealth and guide you through the compliant steps to access nicotine pouches in Australia.',
    },
    {
      question: 'Do I need a prescription for nicotine pouches in Australia?',
      answer:
        'In many cases, nicotine products require medical oversight. A consultation allows a doctor to assess your situation and advise on the appropriate legal pathway.',
    },
    {
      question: 'What happens in the consultation?',
      answer:
        'A doctor reviews your health history, nicotine use, and suitability, then explains next steps. Clinical decisions are made by the doctor during the consultation.',
    },
    {
      question: 'How long does it take?',
      answer:
        'Timeframes vary. You can start with the questionnaire and book a consultation; the rest depends on clinical suitability and the steps required for your situation.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="Zyn in Australia: Is It Legal & How to Get It (2026 Guide)"
        description="Plain-English guidance on Zyns in Australia, including legality, prescriptions, consultation steps, and what to do next."
        canonicalPath={PATH}
        jsonLd={[
          breadcrumbSchema({
            items: [
              { name: 'Home', url: `${SITE_ORIGIN}/` },
              { name: 'Guides', url: `${SITE_ORIGIN}/guides/zyn-australia` },
              { name: 'Zyn Australia', url: `${SITE_ORIGIN}${PATH}` },
            ],
          }),
          faqPageSchema({ url: `${SITE_ORIGIN}${PATH}`, questions: faq }),
        ]}
      />

      <section className="py-12 md:py-16">
        <div className="container max-w-3xl space-y-6">
          <header className="space-y-3">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Zyn in Australia: legality, access, and safe next steps
            </h1>
            <p className="text-muted-foreground">
              Last updated: March 2026
            </p>
            <p className="text-muted-foreground">
              If you’re searching for “Zyns Australia” or “how to get Zyns in Australia”, this guide explains the
              compliant pathway and what to do next.
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
              <CardTitle>Quick answer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Zyn is a brand of nicotine pouches. In Australia, nicotine products are regulated and the “right”
                pathway depends on your circumstances. The safest approach is to use a doctor‑supervised pathway
                where a clinician can assess suitability and guide you through the compliant steps.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">What is Zyn?</h2>
              <p className="text-muted-foreground">
                Zyns are nicotine pouches. They are placed in the mouth (between gum and lip) and deliver nicotine
                without smoking or vaping.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">Are Zyns legal in Australia?</h2>
              <p className="text-muted-foreground">
                Regulations can change and depend on product specifics and how nicotine is supplied. We don’t
                provide legal advice, but we do provide a compliant, doctor‑supervised pathway where the clinician
                explains what is appropriate for you.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">How Australians access nicotine pouches</h2>
              <p className="text-muted-foreground">
                The typical path is: complete a short questionnaire → book a consultation → doctor assesses your
                situation → next steps are explained if clinically appropriate.
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
                    <CardContent className="text-sm text-muted-foreground">
                      {q.answer}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ready to get started?</CardTitle>
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
