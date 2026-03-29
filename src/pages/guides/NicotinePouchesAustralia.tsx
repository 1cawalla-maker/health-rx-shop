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
      question: 'Are nicotine pouches legal in Australia?',
      answer:
        'Rules around nicotine products can be complex and may change. We don’t provide legal advice, but we do provide a doctor‑supervised pathway where a clinician can explain what applies to your situation.',
    },
    {
      question: 'Do nicotine pouches require a prescription in Australia?',
      answer:
        'In many cases, nicotine products require medical oversight. A consultation allows a doctor to assess suitability and advise on the appropriate pathway.',
    },
    {
      question: 'How do I get nicotine pouches in Australia?',
      answer:
        'Start with the questionnaire and book a telehealth consultation. If clinically appropriate, a doctor will guide you through the next steps.',
    },
    {
      question: 'What strengths are available (3mg / 6mg / 9mg)?',
      answer:
        'Strength options vary by product. If a prescription is issued, a doctor may set a maximum strength. You can typically choose that strength or lower and select from available flavours in the shop.',
    },
    {
      question: 'How many cans can I order?',
      answer:
        'Order limits depend on your prescription. If a limit applies, it will be shown in your account and reflected in the shop and cart.',
    },
    {
      question: 'How much does it cost?',
      answer:
        'Costs typically include a consultation fee (shown at booking), product pricing (shown in the shop), and shipping at checkout. Pricing can change over time.',
    },
    {
      question: 'How long does delivery take?',
      answer:
        'Timeframes vary based on clinical suitability and shipping. We provide updates in your account once an order is placed.',
    },
    {
      question: 'Can I switch flavours?',
      answer:
        'If you have an active prescription, you can generally choose from available flavours within your approved strength and allowance.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="Nicotine Pouches in Australia: Legal Access, Prescriptions & Delivery"
        description="A plain-English guide to nicotine pouches in Australia (including Zyn): legality, prescriptions, consultation steps, delivery, and what to do next."
        canonicalPath={PATH}
        ogImagePath="/placeholder.svg"
        ogType="article"
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
              step if you’re considering them. If you’re searching for “Zyns Australia”, this is a good place to
              start.
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
                Nicotine pouches are placed in the mouth (between gum and lip) and deliver nicotine without smoking
                or vaping.
              </p>
              <p>
                In Australia, nicotine products are regulated. The safest way to get clarity is a doctor‑supervised
                telehealth consultation where a clinician can assess suitability and explain the compliant pathway
                for you.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What are nicotine pouches?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Nicotine pouches are small pouches typically placed between the gum and upper lip. Nicotine is
                absorbed through the mouth. There’s no smoke and no vapour.
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
              <ol className="list-decimal pl-5 text-muted-foreground space-y-2">
                <li>Complete the questionnaire (takes a couple of minutes).</li>
                <li>Book a consultation time that suits you.</li>
                <li>A doctor assesses suitability and discusses options.</li>
                <li>If clinically appropriate, access is enabled and any limits are explained.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">What you can expect</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li><strong>Phone-first:</strong> consultations are conducted by phone.</li>
                <li><strong>Doctor-led decisions:</strong> a consultation does not guarantee a prescription.</li>
                <li><strong>Strength guidance:</strong> if approved, a maximum strength may be set.</li>
                <li><strong>Allowance limits:</strong> you may have quantity limits that are enforced in the shop and cart.</li>
                <li><strong>Order updates:</strong> once you place an order, you’ll see status updates in your account.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">How Zyn fits in</h2>
              <p className="text-muted-foreground">
                Zyn is one brand of nicotine pouches. If you searched for “Zyns Australia”, the key point is that
                brand is secondary to suitability and access. A doctor may set a maximum strength, and you can then
                choose from available flavours and products within your approved limits.
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
                <CardTitle>Related guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link className="text-primary underline underline-offset-4 block" to="/guides/zyn-australia">
                  Zyn in Australia
                </Link>
                <Link className="text-primary underline underline-offset-4 block" to="/guides/are-nicotine-pouches-legal-in-australia">
                  Are nicotine pouches legal in Australia?
                </Link>
                <Link className="text-primary underline underline-offset-4 block" to="/guides/nicotine-pouches-vs-vaping">
                  Nicotine pouches vs vaping
                </Link>
              </CardContent>
            </Card>

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
