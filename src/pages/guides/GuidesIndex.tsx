import { PublicLayout } from '@/components/layout/PublicLayout';
import Seo, { SITE_ORIGIN } from '@/components/seo/Seo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const PATH = '/guides';

const guides = [
  {
    title: 'Zyn in Australia',
    description: 'Legality, access, cost basics, and next steps.',
    to: '/guides/zyn-australia',
  },
  {
    title: 'Nicotine pouches in Australia',
    description: 'How access works, prescriptions, delivery, and ordering.',
    to: '/guides/nicotine-pouches-australia',
  },
  {
    title: 'How to get nicotine pouches in Australia',
    description: 'Step-by-step from questionnaire to consultation.',
    to: '/guides/how-to-get-nicotine-pouches-in-australia',
  },
  {
    title: 'Are nicotine pouches legal in Australia?',
    description: 'Plain-English overview and what to do next.',
    to: '/guides/are-nicotine-pouches-legal-in-australia',
  },
  {
    title: 'Personal Importation Scheme (nicotine pouches)',
    description: 'General information and common questions.',
    to: '/guides/personal-importation-scheme-nicotine-pouches',
  },
  {
    title: 'Strength guide: 3mg vs 6mg vs 9mg',
    description: 'How strength choices work and why doctor guidance matters.',
    to: '/guides/nicotine-pouch-strength-3mg-6mg-9mg',
  },
  {
    title: 'Zyn vs other nicotine pouches',
    description: 'What changes, what doesn’t, and how to choose.',
    to: '/guides/zyn-vs-other-nicotine-pouches',
  },
  {
    title: 'Nicotine pouches vs vaping',
    description: 'Key differences, considerations, and access in Australia.',
    to: '/guides/nicotine-pouches-vs-vaping',
  },
];

export default function GuidesIndex() {
  return (
    <PublicLayout>
      <Seo
        title="Guides: Zyn Australia & Nicotine Pouches"
        description="Guides about Zyn in Australia, nicotine pouches, legality, access, strength, and comparisons."
        canonicalPath={PATH}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Guides',
          url: `${SITE_ORIGIN}${PATH}`,
        }}
      />

      <section className="py-12 md:py-16">
        <div className="container max-w-4xl space-y-8">
          <header className="space-y-3">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Guides</h1>
            <p className="text-muted-foreground">
              Plain-English answers for common searches like “Zyns Australia”, “nicotine pouches Australia”, and
              “are Zyns legal in Australia”.
            </p>
            <p className="text-muted-foreground">
              Want the fastest start? <Link className="text-primary underline underline-offset-4" to="/eligibility">Start the questionnaire</Link>.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            {guides.map((g) => (
              <Link key={g.to} to={g.to} className="block">
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{g.title}</CardTitle>
                    <CardDescription>{g.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary underline underline-offset-4">Read guide</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
