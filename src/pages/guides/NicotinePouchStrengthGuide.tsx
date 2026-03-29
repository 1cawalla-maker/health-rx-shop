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
    {
      question: 'How much does it cost?',
      answer:
        'Costs typically include a consultation fee (shown at booking), product pricing (shown in the shop), and shipping at checkout. Pricing can change over time.',
    },
    {
      question: 'Can I choose flavours?',
      answer:
        'If you have an active prescription, you can generally choose from available flavours within your approved strength and allowance.',
    },
  ];

  return (
    <PublicLayout>
      <Seo
        title="3mg vs 6mg vs 9mg Nicotine Pouches: Strength Guide (Australia)"
        description="Strength guide for nicotine pouches in Australia (3mg vs 6mg vs 9mg): how clinicians choose what’s appropriate and how to step down over time."
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
              <CardTitle>Quick answer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Most people choose between 3mg, 6mg, and 9mg based on what they currently use (cigarettes, vaping,
                or prior pouches) and their goal (maintain, switch, or step down).
              </p>
              <p>
                Strength is not just preference—it’s part of clinical suitability. A doctor may set a maximum
                strength, and you can usually choose that strength or lower.
              </p>
            </CardContent>
          </Card>

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

          <Card>
            <CardHeader>
              <CardTitle>How doctors typically think about strength</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li>Your current nicotine use (cigarettes, vaping, prior pouches)</li>
                <li>How dependent you feel on nicotine</li>
                <li>Health history and any risk factors</li>
                <li>Your goal (maintain, switch, or step down)</li>
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
