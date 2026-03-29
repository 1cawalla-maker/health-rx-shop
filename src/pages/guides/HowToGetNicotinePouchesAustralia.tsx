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
        'Start with the questionnaire, then book a telehealth consultation. If clinically appropriate, a doctor will guide you through the next steps.',
    },
    {
      question: 'How do I get Zyns in Australia?',
      answer:
        'Zyn is a brand of nicotine pouches. The simplest compliant path is the same: complete the questionnaire and book a consultation so a doctor can assess suitability and explain next steps.',
    },
    {
      question: 'Do I choose a doctor?',
      answer:
        'You select a time. A doctor is assigned after booking confirmation.',
    },
    {
      question: 'How much does it cost?',
      answer:
        'Costs typically include a consultation fee (shown at booking), product pricing (shown in the shop), and shipping at checkout. Pricing can change over time.',
    },
    {
      question: 'How long does it take?',
      answer:
        'Timeframes vary. The fastest way to start is to complete the questionnaire and book a consultation time that suits you.',
    },
    {
      question: 'What happens if I’m not approved?',
      answer:
        'Not all consultations result in a prescription. Clinical decisions are made by the doctor during the consultation based on your health history and nicotine use.',
    },
    {
      question: 'Can I upload an existing prescription instead?',
      answer:
        'If you already have a valid prescription, you can upload it for review. Otherwise, book a consultation to be assessed by a doctor.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="How to Get Nicotine Pouches in Australia (Step‑by‑Step)"
        description="Step-by-step: how to get nicotine pouches in Australia (including Zyn) via a compliant, doctor-supervised telehealth pathway."
        canonicalPath={PATH}
        ogImagePath="/placeholder.svg"
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
              If you’re searching “how to get nicotine pouches in Australia” (or “how to get Zyns in Australia”),
              here’s the simplest compliant path.
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
              <p className="text-muted-foreground">
                You don’t need to choose a doctor—just pick a time. A doctor is assigned after booking confirmation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typical timeframes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Questionnaire:</strong> a couple of minutes.</li>
                <li><strong>Booking:</strong> choose the next available time that suits you.</li>
                <li><strong>Consultation:</strong> doctor assesses suitability and discusses next steps.</li>
                <li><strong>Ordering:</strong> if approved, you can order within your limits and see order status updates in your account.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips to make it smooth</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li>Have your phone nearby at your scheduled time (consultations are by phone).</li>
                <li>Be ready to discuss your nicotine use and any relevant medical history.</li>
                <li>If a prescription is issued, follow any limits (such as maximum strength and allowance).</li>
                <li>If you already have a valid prescription, you can upload it instead of booking a consult.</li>
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
                <CardTitle>Related guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link className="text-primary underline underline-offset-4 block" to="/guides/zyn-australia">
                  Zyn in Australia
                </Link>
                <Link className="text-primary underline underline-offset-4 block" to="/guides/nicotine-pouches-australia">
                  Nicotine pouches in Australia
                </Link>
                <Link className="text-primary underline underline-offset-4 block" to="/guides/nicotine-pouches-vs-vaping">
                  Nicotine pouches vs vaping
                </Link>
              </CardContent>
            </Card>

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
