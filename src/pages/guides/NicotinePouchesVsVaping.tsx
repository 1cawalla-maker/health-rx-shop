import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Seo, { SITE_ORIGIN } from '@/components/seo/Seo';
import { breadcrumbSchema, faqPageSchema } from '@/components/seo/schema';

const PATH = '/guides/nicotine-pouches-vs-vaping';

export default function GuideNicotinePouchesVsVaping() {
  const faq = [
    {
      question: 'Are nicotine pouches safer than vaping?',
      answer:
        'Health impacts vary by person and product. We avoid broad safety claims—your consultation is where a doctor can discuss suitability and risks for you.',
    },
    {
      question: 'Do nicotine pouches help people quit smoking?',
      answer:
        'Some people use nicotine products as part of a harm‑reduction approach. A doctor can help you choose an appropriate plan based on your goals and health history.',
    },
    {
      question: 'Do nicotine pouches contain tobacco?',
      answer:
        'Many nicotine pouches contain nicotine without tobacco leaf, but product composition varies. We focus on a doctor‑supervised pathway and clinically appropriate guidance.',
    },
    {
      question: 'How do I access nicotine pouches in Australia?',
      answer:
        'Start with the questionnaire and book a telehealth consultation. A qualified doctor will assess suitability and explain next steps.',
    },
    {
      question: 'How much does it cost?',
      answer:
        'Costs vary. A consultation fee applies, and product/shipping costs depend on what’s clinically appropriate and what you choose in the shop.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="Nicotine Pouches vs Vaping (Australia): Differences, Risks & Access"
        description="Compare nicotine pouches vs vaping in Australia: key differences, considerations, and how a doctor can help you decide on the right next step."
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
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Nicotine pouches vs vaping</h1>
            <p className="text-muted-foreground">Last updated: March 2026</p>
            <p className="text-muted-foreground">
              If you’re comparing nicotine pouches vs vaping in Australia, here’s a plain‑English overview of how
              they differ and what to do next.
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
              <CardTitle>At a glance</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Nicotine pouches:</strong> nicotine absorbed through the mouth. No smoke, no vapour.
              </p>
              <p>
                <strong>Vaping:</strong> aerosol inhalation. Device‑based.
              </p>
              <p>
                The right choice depends on your health history, nicotine dependence, and goals—this is best
                discussed with a doctor.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">Key differences</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong>Delivery:</strong> mouth (pouches) vs inhalation (vaping)</li>
                <li><strong>Discretion:</strong> no vapour/smell vs device use</li>
                <li><strong>Nicotine dose:</strong> varies by product and how it’s used</li>
                <li><strong>Convenience:</strong> contexts differ (work, travel, indoors)</li>
              </ul>
              <p className="text-muted-foreground">
                If you’re unsure which path makes sense, a doctor can help align your choice with your goals and
                health history.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">Which option is right for you?</h2>
              <p className="text-muted-foreground">
                People compare pouches and vaping for different reasons—quitting smoking, reducing nicotine,
                discretion, or avoiding devices. The right choice depends on your medical history and nicotine use.
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>If you want a device‑free option, nicotine pouches may suit.</li>
                <li>If you’re currently vaping and want to step down, a doctor can help plan the transition.</li>
                <li>If you have health conditions or take medications, get clinician advice before changing products.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">Health and safety considerations</h2>
              <p className="text-muted-foreground">
                We don’t make blanket claims about what is “safer”. A consultation allows a doctor to consider your
                personal risk factors and advise accordingly.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">Access in Australia</h2>
              <p className="text-muted-foreground">
                Nicotine products in Australia are regulated. Start with the questionnaire and book a consultation so
                a doctor can assess suitability and explain the compliant next steps.
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
                <CardTitle>Next step</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Start the questionnaire and book a consultation. A qualified doctor will make the final clinical
                  assessment and guide you.
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
