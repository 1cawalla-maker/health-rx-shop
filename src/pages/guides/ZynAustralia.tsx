import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Seo from '@/components/seo/Seo';
import { articleSchema, breadcrumbSchema, faqPageSchema, webPageSchema } from '@/components/seo/schema';
import { SITE_ORIGIN } from '@/components/seo/Seo';

const PATH = '/guides/zyn-australia';

export default function GuideZynAustralia() {
  const faq = [
    {
      question: 'Are Zyns legal in Australia?',
      answer:
        'Australian rules around nicotine products can be complex and can change. The safest way to access nicotine pouches is via a compliant, doctor‑supervised pathway where a clinician assesses whether it is appropriate for you.',
    },
    {
      question: 'How can I get Zyns in Australia legally?',
      answer:
        'Start with the questionnaire, then book a telehealth consultation. If clinically appropriate, a doctor can guide you through the next steps to access nicotine pouches in Australia.',
    },
    {
      question: 'Do I need a prescription for nicotine pouches in Australia?',
      answer:
        'In many cases, nicotine products require medical oversight. A consultation allows a doctor to assess your situation and advise on the appropriate pathway.',
    },
    {
      question: 'How much does it cost?',
      answer:
        'Costs typically include a consultation fee (shown at booking), product pricing (shown in the shop), and shipping at checkout. Pricing can change over time.',
    },
    {
      question: 'What strengths are available (3mg / 6mg / 9mg)?',
      answer:
        'Strength options vary by product. If a prescription is issued, a doctor may set a maximum strength. You can typically choose that strength or lower and select from available flavours in the shop.',
    },
    {
      question: 'How many cans can I order?',
      answer:
        'Order limits depend on your prescription. If a limit applies, it will be shown in your account and enforced in the shop and cart.',
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
    {
      question: 'Can I choose strength and flavours?',
      answer:
        'If a prescription is issued, the doctor may set a maximum strength. You can typically choose that strength or lower and select from available flavours in the shop.',
    },
    {
      question: 'How long does delivery take?',
      answer:
        'Delivery times vary. Once an order is placed, you’ll see status updates in your account as it progresses.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="Zyn in Australia: Is It Legal & How to Get It (2026 Guide)"
        description="Plain-English guidance on Zyns in Australia, including legality, prescriptions, consultation steps, costs, and what to do next."
        canonicalPath={PATH}
        ogImagePath="/og/zyn-australia.png"
        ogType="article"
        jsonLd={[
          webPageSchema({
            url: `${SITE_ORIGIN}${PATH}`,
            name: 'Zyn in Australia',
            description:
              'Plain-English guidance on Zyns in Australia, including legality, prescriptions, consultation steps, costs, and what to do next.',
            dateModified: '2026-03-30',
          }),
          articleSchema({
            url: `${SITE_ORIGIN}${PATH}`,
            siteOrigin: SITE_ORIGIN,
            headline: 'Zyn in Australia: legality, access, and safe next steps',
            description:
              'Plain-English guidance on Zyns in Australia, including legality, prescriptions, consultation steps, costs, and what to do next.',
            dateModified: '2026-03-30',
          }),
          breadcrumbSchema({
            items: [
              { name: 'Home', url: `${SITE_ORIGIN}/` },
              { name: 'Guides', url: `${SITE_ORIGIN}/guides` },
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
                Zyn is a brand of nicotine pouches. Nicotine pouches are placed in the mouth (between gum and lip)
                and deliver nicotine without smoking or vaping.
              </p>
              <p className="text-muted-foreground">
                People typically search “Zyns Australia” because they want a discreet, device‑free nicotine option.
                In Australia, the important part isn’t the brand name—it’s following a compliant pathway and using
                a product/strength that’s clinically appropriate.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">Are Zyns legal in Australia?</h2>
              <p className="text-muted-foreground">
                Regulations can change and depend on product specifics and how nicotine is supplied. We don’t
                provide legal advice, but we do provide a compliant, doctor‑supervised pathway where the clinician
                explains what is appropriate for you.
              </p>
              <p className="text-muted-foreground">
                If you’re unsure, the most reliable next step is to start the questionnaire and book a consultation—
                a doctor can explain what applies to your situation.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">How Australians access nicotine pouches</h2>
              <p className="text-muted-foreground">
                The typical path is: complete a short questionnaire → book a consultation → doctor assesses your
                situation → next steps are explained if clinically appropriate.
              </p>
              <ol className="list-decimal pl-5 text-muted-foreground space-y-2">
                <li>Complete the questionnaire (takes a couple of minutes).</li>
                <li>Book a consultation time that suits you.</li>
                <li>Speak with an AHPRA‑registered doctor by phone.</li>
                <li>If clinically appropriate, your doctor will explain next steps and any limits (like max strength).</li>
              </ol>
              <p className="text-muted-foreground">
                Prefer to read first? Start here: <Link className="text-primary underline underline-offset-4" to="/guides">Browse all guides</Link>.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">Strength, limits, and ordering</h2>
              <p className="text-muted-foreground">
                If a prescription is issued, your doctor may set a maximum strength. You can typically choose that
                strength or lower and select from available flavours in the shop.
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong>Strength:</strong> commonly 3mg / 6mg / 9mg (doctor‑guided).</li>
                <li><strong>Allowance:</strong> you may have quantity limits that are enforced in the shop and cart.</li>
                <li><strong>Order updates:</strong> once you place an order, you’ll see tracking/status updates in your account.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">How much does it cost?</h2>
              <p className="text-muted-foreground">
                Pricing depends on your situation and what’s clinically appropriate. As a guide, costs typically
                include:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>
                  <strong>Consultation fee:</strong> shown during booking.
                </li>
                <li>
                  <strong>Products:</strong> pricing varies by brand, strength, and quantity. Product prices are shown in
                  the shop.
                </li>
                <li>
                  <strong>Shipping:</strong> calculated at checkout.
                </li>
              </ul>
              <p className="text-xs text-muted-foreground">
                Note: A consultation does not guarantee a prescription. Clinical decisions are made by the doctor.
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
                <CardTitle>Related guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link className="text-primary underline underline-offset-4 block" to="/guides/nicotine-pouches-australia">
                  Nicotine pouches in Australia
                </Link>
                <Link className="text-primary underline underline-offset-4 block" to="/guides/how-to-get-nicotine-pouches-in-australia">
                  How to get nicotine pouches in Australia
                </Link>
                <Link className="text-primary underline underline-offset-4 block" to="/guides/nicotine-pouches-vs-vaping">
                  Nicotine pouches vs vaping
                </Link>
              </CardContent>
            </Card>

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
