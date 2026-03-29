import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Seo, { SITE_ORIGIN } from '@/components/seo/Seo';
import { articleSchema, breadcrumbSchema, faqPageSchema, webPageSchema } from '@/components/seo/schema';

const PATH = '/guides/are-nicotine-pouches-legal-in-australia';

export default function GuideAreNicotinePouchesLegalAustralia() {
  const faq = [
    {
      question: 'Are nicotine pouches legal in Australia?',
      answer:
        'Regulations around nicotine products can be complex and may change. The safest approach is a doctor‑supervised pathway where a clinician can explain the compliant options available to you.',
    },
    {
      question: 'Do I need a prescription?',
      answer:
        'In many cases, nicotine products require medical oversight. A consultation allows a doctor to assess suitability and advise on the appropriate pathway.',
    },
    {
      question: 'How do I access nicotine pouches in Australia?',
      answer:
        'Start with the questionnaire and book a telehealth consultation. If clinically appropriate, a doctor will guide you through the next steps.',
    },
    {
      question: 'How much does it cost?',
      answer:
        'Costs typically include a consultation fee (shown at booking), product pricing (shown in the shop), and shipping at checkout. Pricing can change over time.',
    },
    {
      question: 'What should I do next?',
      answer:
        'Start with the questionnaire and book a consultation. A qualified doctor will make the final clinical assessment.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="Are Nicotine Pouches Legal in Australia? (Plain‑English Answer)"
        description="A plain-English overview of nicotine pouch legality in Australia (including Zyn) and the safest next step: a doctor-supervised consultation pathway."
        canonicalPath={PATH}
        ogImagePath="/placeholder.svg"
        ogType="article"
        jsonLd={[
          webPageSchema({
            url: `${SITE_ORIGIN}${PATH}`,
            name: 'Are nicotine pouches legal in Australia?',
            description:
              'A plain-English overview of nicotine pouch legality in Australia (including Zyn) and the safest next step: a doctor-supervised consultation pathway.',
          }),
          articleSchema({
            url: `${SITE_ORIGIN}${PATH}`,
            headline: 'Are nicotine pouches legal in Australia? (plain-English answer)',
            description:
              'A plain-English overview of nicotine pouch legality in Australia (including Zyn) and the safest next step: a doctor-supervised consultation pathway.',
            dateModified: '2026-03-01',
          }),
          breadcrumbSchema({
            items: [
              { name: 'Home', url: `${SITE_ORIGIN}/` },
              { name: 'Guides', url: `${SITE_ORIGIN}/guides` },
              { name: 'Are nicotine pouches legal in Australia?', url: `${SITE_ORIGIN}${PATH}` },
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
            <p className="text-muted-foreground">
              This is also why searches like “are Zyns legal in Australia” are common—people want clarity. The
              fastest next step is a consultation where a doctor can explain what applies to you.
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
                Nicotine products are regulated in Australia and the details can be nuanced and change over time.
                We don’t provide legal advice.
              </p>
              <p>
                The safest next step is a doctor‑supervised consultation pathway where a qualified clinician can
                assess suitability and explain the compliant options that apply to your situation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plain-English overview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                People searching for “are nicotine pouches legal in Australia” (or “are Zyns legal in Australia”)
                usually want clarity on what’s allowed and what to do next.
              </p>
              <p>
                We don’t provide legal advice. What we do provide is a doctor‑supervised pathway where a qualified
                clinician assesses suitability and explains the compliant next steps.
              </p>
              <p>
                In practice, the key idea is simple: don’t guess. Regulations can be nuanced and what’s appropriate
                depends on your circumstances.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common reasons people ask this</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li>They’ve used Zyn or other nicotine pouches overseas and want to understand Australian rules.</li>
                <li>They’re comparing nicotine pouches vs vaping and want a device-free option.</li>
                <li>They want clinician guidance on strength and suitability.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to do next</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Complete the short questionnaire.</li>
                <li>Book a consultation time that suits you.</li>
                <li>A doctor will assess your situation and explain next steps if clinically appropriate.</li>
              </ol>
              <p>
                If you already have a valid prescription, you can upload it instead of booking a consultation.
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
                <CardTitle>Related guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link className="text-primary underline underline-offset-4 block" to="/guides/zyn-australia">
                  Zyn in Australia
                </Link>
                <Link className="text-primary underline underline-offset-4 block" to="/guides/how-to-get-nicotine-pouches-in-australia">
                  How to get nicotine pouches in Australia
                </Link>
                <Link className="text-primary underline underline-offset-4 block" to="/guides/personal-importation-scheme-nicotine-pouches">
                  Personal Importation Scheme (nicotine pouches)
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
